package com.eatomato.backend.insight;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.global.time.Times;
import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.JsonNode;

/**
 * 개선 제안 에이전트 실행 관리(작업 큐).
 * 매일 아침 DAILY 실행을 자동으로 쌓고, 관리자는 '지금 분석하기'로 MANUAL 실행을 쌓는다.
 * Python 워커가 claim 으로 가져가 complete 로 결과를 내면, 결과 속 제안을 InsightSuggestionService 가 보드에 저장한다.
 * AI 비용을 지키려고 한 번에 하나만 진행하고, 관리자 요청은 하루 dailyLimit 번으로 제한한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InsightRunService {

	private static final Set<InsightRun.Status> ACTIVE = EnumSet.of(InsightRun.Status.PENDING, InsightRun.Status.RUNNING);
	private static final int ERROR_MAX = 500;

	private final InsightRunRepository repository;
	private final InsightSuggestionService suggestionService;
	private final InsightProperties properties;

	/** 관리자의 '지금 분석하기'. */
	@Transactional
	public InsightRunResponse request(Long adminId) {
		if (repository.existsByStatusIn(ACTIVE)) {
			throw new ApiException(ErrorCode.INSIGHT_RUN_IN_PROGRESS);
		}
		LocalDateTime today = Times.now().toLocalDate().atStartOfDay();
		if (repository.countByKindAndCreatedAtGreaterThanEqual(InsightRun.Kind.MANUAL, today) >= properties.dailyLimit()) {
			throw new ApiException(ErrorCode.INSIGHT_DAILY_LIMIT);
		}
		return InsightRunResponse.summary(repository.save(new InsightRun(InsightRun.Kind.MANUAL, adminId)));
	}

	/**
	 * 매일 아침 자동 분석. 08:00 부터 11:30 까지 30분마다 확인해, 오늘 DAILY 실행이 아직 없고 진행 중인 분석도 없으면 쌓는다
	 * (서버가 8시에 재시작 중이었거나 관리자 분석이 돌고 있어도 그날 안에 한 번은 만든다).
	 */
	@Scheduled(cron = "0 0/30 8-11 * * *", zone = "Asia/Seoul")
	@Transactional
	public void scheduleDaily() {
		if (!properties.enabled()) {
			return;
		}
		Optional<InsightRun> created = createDailyIfDue();
		created.ifPresent(run -> log.info("오늘의 개선 제안 분석을 요청했습니다: run={}", run.getId()));
	}

	@Transactional
	public Optional<InsightRun> createDailyIfDue() {
		LocalDateTime today = Times.now().toLocalDate().atStartOfDay();
		if (repository.existsByKindAndCreatedAtGreaterThanEqual(InsightRun.Kind.DAILY, today)
			|| repository.existsByStatusIn(ACTIVE)) {
			return Optional.empty();
		}
		return Optional.of(repository.save(new InsightRun(InsightRun.Kind.DAILY, null)));
	}

	public List<InsightRunResponse> recent() {
		return repository.findTop20ByOrderByCreatedAtDescIdDesc().stream().map(InsightRunResponse::summary).toList();
	}

	public InsightRunResponse get(Long id) {
		return InsightRunResponse.detail(find(id));
	}

	/** 보드 위쪽: 가장 최근에 끝난 분석(요약 포함), 진행 중인 분석, 상태별 제안 수. */
	public Overview overview() {
		return new Overview(
			repository.findFirstByStatusOrderByFinishedAtDescIdDesc(InsightRun.Status.DONE)
				.map(InsightRunResponse::detail).orElse(null),
			repository.findFirstByStatusInOrderByCreatedAtDescIdDesc(ACTIVE).map(InsightRunResponse::summary).orElse(null),
			suggestionService.countsByStatus());
	}

	/** 가장 오래된 대기 실행을 RUNNING 으로 바꿔 돌려준다. 없으면 빈 값. */
	@Transactional
	public Optional<InsightRun> claim() {
		Optional<InsightRun> next = repository.findFirstByStatusOrderByCreatedAtAscIdAsc(InsightRun.Status.PENDING);
		if (next.isEmpty() || repository.claim(next.get().getId(), Times.now()) == 0) {
			return Optional.empty();
		}
		return repository.findById(next.get().getId());
	}

	/** 워커의 결과. DONE 이면 report(제안 포함), FAILED 면 error 가 있어야 한다. */
	@Transactional
	public void complete(Long id, CompleteRequest request) {
		InsightRun run = find(id);
		if (run.getStatus() != InsightRun.Status.RUNNING) {
			throw new ApiException(ErrorCode.INSIGHT_RUN_NOT_RUNNING);
		}
		boolean done = request.status() == InsightRun.Status.DONE;
		if (done ? request.report() == null || !request.report().isObject() : request.error() == null) {
			throw new ApiException(ErrorCode.INVALID_REQUEST);
		}
		run.finish(request.status(),
			done ? request.report().toString() : null,
			request.trace() == null ? null : request.trace().toString(),
			truncate(request.error()),
			request.model(), request.inputTokens(), request.outputTokens(), request.toolCalls());
		if (done) {
			int created = suggestionService.ingest(run.getId(), request.report());
			log.info("개선 제안 분석 완료: run={} 새 제안 {}건", run.getId(), created);
		}
	}

	/** 워커가 멈춰 결과를 보내지 않은 실행을 실패로 정리해 다음 요청을 막지 않게 한다. */
	@Scheduled(fixedDelay = 5 * 60 * 1000, initialDelay = 2 * 60 * 1000)
	@Transactional
	public void failStale() {
		List<InsightRun> stale = repository.findByStatusAndStartedAtBefore(InsightRun.Status.RUNNING,
			Times.now().minus(properties.staleAfter()));
		stale.forEach(InsightRun::timeOut);
		if (!stale.isEmpty()) {
			log.warn("개선 제안 분석 시간 초과로 실패 처리: {}건", stale.size());
		}
	}

	private InsightRun find(Long id) {
		return repository.findById(id).orElseThrow(() -> new ApiException(ErrorCode.INSIGHT_RUN_NOT_FOUND));
	}

	private static String truncate(String error) {
		return error == null || error.length() <= ERROR_MAX ? error : error.substring(0, ERROR_MAX);
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record Overview(InsightRunResponse latest, InsightRunResponse active, Map<String, Long> counts) {
	}

	/**
	 * 워커가 보내는 결과.
	 *
	 * @param status DONE 또는 FAILED
	 * @param report 리포트(JSON 객체). DONE 일 때 필수. suggestions·reconfirmed·follow_ups 를 보드에 반영한다
	 * @param trace  도구 호출 기록(JSON). 선택
	 */
	public record CompleteRequest(
		@jakarta.validation.constraints.NotNull InsightRun.Status status,
		JsonNode report,
		JsonNode trace,
		String error,
		@jakarta.validation.constraints.Size(max = 60) String model,
		Integer inputTokens,
		Integer outputTokens,
		Integer toolCalls) {
	}
}
