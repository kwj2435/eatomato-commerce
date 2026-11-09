package com.eatomato.backend.insight;

import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.global.time.Times;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.JsonNode;

/**
 * 인사이트 분석 실행 관리(작업 큐). 관리자가 요청하면 PENDING 으로 쌓고, Python 워커가 claim 으로 가져가 complete 로 결과를 낸다.
 * AI 비용을 지키려고 한 번에 하나만 진행하고 하루 요청 수를 제한한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InsightRunService {

	private static final Set<InsightRun.Status> ACTIVE = EnumSet.of(InsightRun.Status.PENDING, InsightRun.Status.RUNNING);
	private static final int ERROR_MAX = 500;

	private final InsightRunRepository repository;
	private final InsightProperties properties;

	@Transactional
	public InsightRunResponse request(Long adminId, String question) {
		String cleaned = question == null || question.isBlank() ? null : question.strip();
		if (repository.existsByStatusIn(ACTIVE)) {
			throw new ApiException(ErrorCode.INSIGHT_RUN_IN_PROGRESS);
		}
		if (repository.countByCreatedAtGreaterThanEqual(Times.now().toLocalDate().atStartOfDay()) >= properties.dailyLimit()) {
			throw new ApiException(ErrorCode.INSIGHT_DAILY_LIMIT);
		}
		return InsightRunResponse.summary(repository.save(new InsightRun(adminId, cleaned)));
	}

	public List<InsightRunResponse> recent() {
		return repository.findTop20ByOrderByCreatedAtDescIdDesc().stream().map(InsightRunResponse::summary).toList();
	}

	public InsightRunResponse get(Long id) {
		return InsightRunResponse.detail(find(id));
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

	/** 워커의 결과. DONE 이면 report, FAILED 면 error 가 있어야 한다. */
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
	}

	/** 워커가 멈춰 결과를 보내지 않은 실행을 실패로 정리해 다음 요청을 막지 않게 한다. */
	@Scheduled(fixedDelay = 5 * 60 * 1000, initialDelay = 2 * 60 * 1000)
	@Transactional
	public void failStale() {
		List<InsightRun> stale = repository.findByStatusAndStartedAtBefore(InsightRun.Status.RUNNING,
			Times.now().minus(properties.staleAfter()));
		stale.forEach(InsightRun::timeOut);
		if (!stale.isEmpty()) {
			log.warn("인사이트 분석 시간 초과로 실패 처리: {}건", stale.size());
		}
	}

	private InsightRun find(Long id) {
		return repository.findById(id).orElseThrow(() -> new ApiException(ErrorCode.INSIGHT_RUN_NOT_FOUND));
	}

	private static String truncate(String error) {
		return error == null || error.length() <= ERROR_MAX ? error : error.substring(0, ERROR_MAX);
	}

	/**
	 * 워커가 보내는 결과.
	 *
	 * @param status DONE 또는 FAILED
	 * @param report 리포트(JSON 객체). DONE 일 때 필수
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
