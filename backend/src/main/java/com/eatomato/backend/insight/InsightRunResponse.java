package com.eatomato.backend.insight;

import java.time.OffsetDateTime;

import com.eatomato.backend.global.time.Times;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonRawValue;

/**
 * 관리자 화면의 인사이트 분석 한 건.
 * report·trace 는 워커가 보낸 JSON(저장할 때 파싱해 검증함)을 그대로 끼워 넣는다. 목록에서는 빼고 상세에서만 준다.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record InsightRunResponse(
	Long id,
	String question,
	String status,
	@JsonRawValue String report,
	@JsonRawValue String trace,
	String error,
	String model,
	Integer inputTokens,
	Integer outputTokens,
	Integer toolCalls,
	OffsetDateTime createdAt,
	OffsetDateTime startedAt,
	OffsetDateTime finishedAt
) {

	public static InsightRunResponse summary(InsightRun run) {
		return of(run, false);
	}

	public static InsightRunResponse detail(InsightRun run) {
		return of(run, true);
	}

	private static InsightRunResponse of(InsightRun run, boolean withBody) {
		return new InsightRunResponse(
			run.getId(),
			run.getQuestion(),
			run.getStatus().name(),
			withBody ? run.getReport() : null,
			withBody ? run.getTrace() : null,
			run.getError(),
			run.getModel(),
			run.getInputTokens(),
			run.getOutputTokens(),
			run.getToolCalls(),
			Times.toOffset(run.getCreatedAt()),
			run.getStartedAt() == null ? null : Times.toOffset(run.getStartedAt()),
			run.getFinishedAt() == null ? null : Times.toOffset(run.getFinishedAt()));
	}
}
