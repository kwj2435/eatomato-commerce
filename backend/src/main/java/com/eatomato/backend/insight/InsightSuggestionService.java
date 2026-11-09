package com.eatomato.backend.insight;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.global.time.Times;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonRawValue;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.JsonNode;

/**
 * 개선 제안 보드.
 *
 * 에이전트 결과(report)에서 새 제안·다시 확인·효과 확인을 꺼내 저장한다. AI 가 낸 값은 믿지 않고 하나씩 검사해
 * 잘못된 항목은 건너뛴다(실행 전체를 실패시키지 않는다).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InsightSuggestionService {

	/** 한 번 실행에서 받는 새 제안 수. 매일 쌓이므로 적게 받는다. */
	static final int MAX_NEW_PER_RUN = 3;
	/** 완료 후 이만큼 지나야 효과를 확인한다. */
	static final Duration FOLLOW_UP_AFTER = Duration.ofDays(7);
	/** 에이전트에게 보여 주는 지난 제안 기간(닫힌 제안도 이 기간 안이면 다시 내지 않게). */
	static final Duration CONTEXT_WINDOW = Duration.ofDays(60);

	private final InsightSuggestionRepository repository;

	public List<SuggestionResponse> list() {
		return repository.findAllByOrderByCreatedAtDescIdDesc().stream().map(SuggestionResponse::of).toList();
	}

	public Map<String, Long> countsByStatus() {
		return Arrays.stream(InsightSuggestion.Status.values())
			.collect(Collectors.toMap(Enum::name, repository::countByStatus, (a, b) -> a, java.util.LinkedHashMap::new));
	}

	@Transactional
	public SuggestionResponse changeStatus(Long id, InsightSuggestion.Status status) {
		InsightSuggestion suggestion = repository.findById(id)
			.orElseThrow(() -> new ApiException(ErrorCode.INSIGHT_SUGGESTION_NOT_FOUND));
		suggestion.changeStatus(status);
		return SuggestionResponse.of(suggestion);
	}

	/** 워커가 분석을 시작할 때 받는 지난 제안과 효과 확인 대상. */
	public Context context() {
		LocalDateTime now = Times.now();
		List<InsightSuggestion> recent = repository.findByCreatedAtGreaterThanEqualOrStatusInOrderByCreatedAtDesc(
			now.minus(CONTEXT_WINDOW),
			List.of(InsightSuggestion.Status.NEW, InsightSuggestion.Status.ADOPTED, InsightSuggestion.Status.ON_HOLD));
		LocalDateTime cutoff = now.minus(FOLLOW_UP_AFTER);
		return new Context(
			recent.stream().map(s -> new Context.Item(s.getId(), s.getCategory().name(), s.getTitle(), s.getStatus().name(),
				s.getCreatedAt().toLocalDate())).toList(),
			recent.stream().filter(s -> s.isFollowUpDue(cutoff))
				.map(s -> new Context.FollowUp(s.getId(), s.getTitle(), s.getMetric(), s.getDoneAt().toLocalDate()))
				.toList());
	}

	/** 실행 결과 저장. 반환값은 새로 만든 제안 수. */
	@Transactional
	public int ingest(Long runId, JsonNode report) {
		int created = 0;
		for (JsonNode item : report.path("suggestions").values()) {
			if (created >= MAX_NEW_PER_RUN) {
				break;
			}
			Optional<InsightSuggestion> suggestion = parseSuggestion(runId, item);
			if (suggestion.isPresent()) {
				repository.save(suggestion.get());
				created++;
			}
		}

		Map<Long, InsightSuggestion> byId = repository.findAllById(
				report.path("reconfirmed").values().stream().map(n -> n.path("id").asLong(0)).toList())
			.stream().collect(Collectors.toMap(InsightSuggestion::getId, Function.identity()));
		for (JsonNode item : report.path("reconfirmed").values()) {
			InsightSuggestion target = byId.get(item.path("id").asLong(0));
			if (target != null && target.getStatus().isOpen()) {
				target.reconfirm(text(item, "note", 500));
			}
		}

		LocalDateTime cutoff = Times.now().minus(FOLLOW_UP_AFTER);
		for (JsonNode item : report.path("follow_ups").values()) {
			repository.findById(item.path("id").asLong(0))
				.filter(s -> s.isFollowUpDue(cutoff))
				.filter(s -> item.path("verdict").isString() && item.path("summary").isString())
				.ifPresent(s -> s.recordFollowUp(item.toString()));
		}
		return created;
	}

	private Optional<InsightSuggestion> parseSuggestion(Long runId, JsonNode item) {
		InsightSuggestion.Category category = enumOf(InsightSuggestion.Category.class, item.path("category"));
		InsightSuggestion.Level impact = enumOf(InsightSuggestion.Level.class, item.path("impact"));
		InsightSuggestion.Level effort = enumOf(InsightSuggestion.Level.class, item.path("effort"));
		InsightSuggestion.Level confidence = enumOf(InsightSuggestion.Level.class, item.path("confidence"));
		String title = text(item, "title", 200);
		String problem = text(item, "problem", 1000);
		String proposal = text(item, "proposal", 1000);
		String metric = text(item, "metric", 300);
		if (category == null || impact == null || effort == null || confidence == null
			|| title == null || problem == null || proposal == null || metric == null) {
			log.warn("형식이 맞지 않는 제안을 건너뜀: run={}", runId);
			return Optional.empty();
		}
		JsonNode evidence = item.path("evidence");
		return Optional.of(new InsightSuggestion(runId, category, title, problem, proposal,
			evidence.isArray() ? evidence.toString() : "[]", metric, impact, effort, confidence));
	}

	private static <E extends Enum<E>> E enumOf(Class<E> type, JsonNode node) {
		if (!node.isString()) {
			return null;
		}
		try {
			return Enum.valueOf(type, node.stringValue().trim().toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException e) {
			return null;
		}
	}

	/** 빈 문자열이면 null, 길면 자른다. */
	private static String text(JsonNode item, String field, int max) {
		JsonNode node = item.path(field);
		if (!node.isString() || node.stringValue().isBlank()) {
			return null;
		}
		String value = node.stringValue().strip();
		return value.length() <= max ? value : value.substring(0, max);
	}

	/** 워커에 주는 문맥. items 는 최근 60일 제안과 열린 제안, followUpDue 는 효과를 확인할 완료 제안. */
	public record Context(List<Item> items, List<FollowUp> followUpDue) {

		public record Item(Long id, String category, String title, String status, LocalDate createdOn) {
		}

		public record FollowUp(Long id, String title, String metric, LocalDate doneOn) {
		}
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record SuggestionResponse(
		Long id,
		Long runId,
		String category,
		String title,
		String problem,
		String proposal,
		@JsonRawValue String evidence,
		String metric,
		String impact,
		String effort,
		String confidence,
		String status,
		int reconfirmCount,
		String reconfirmNote,
		OffsetDateTime reconfirmedAt,
		@JsonRawValue String followUp,
		OffsetDateTime createdAt,
		OffsetDateTime statusChangedAt,
		OffsetDateTime doneAt
	) {

		static SuggestionResponse of(InsightSuggestion s) {
			return new SuggestionResponse(s.getId(), s.getRunId(), s.getCategory().name(), s.getTitle(), s.getProblem(),
				s.getProposal(), s.getEvidence(), s.getMetric(), s.getImpact().name(), s.getEffort().name(),
				s.getConfidence().name(), s.getStatus().name(), s.getReconfirmCount(), s.getReconfirmNote(),
				offset(s.getReconfirmedAt()), s.getFollowUp(), offset(s.getCreatedAt()), offset(s.getStatusChangedAt()),
				offset(s.getDoneAt()));
		}

		private static OffsetDateTime offset(LocalDateTime time) {
			return time == null ? null : Times.toOffset(time);
		}
	}
}
