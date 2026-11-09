package com.eatomato.backend.insight;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.eatomato.backend.global.time.Times;

/**
 * 개선 제안 에이전트 실행 한 번. DAILY 는 매일 아침 자동, MANUAL 은 관리자가 '지금 분석하기'를 누른 것이다.
 * question 은 이전 질문형 실행의 기록으로만 남는다(새 실행은 null).
 */
@Entity
@Table(name = "insight_run")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InsightRun {

	public enum Status {
		PENDING, RUNNING, DONE, FAILED
	}

	public enum Kind {
		DAILY, MANUAL
	}

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Enumerated(EnumType.STRING)
	private Kind kind;

	private String question;

	@Enumerated(EnumType.STRING)
	private Status status;

	private Long requestedBy;

	/** 리포트 JSON. 워커가 보낸 JSON 을 파싱해 검증한 뒤 문자열로 저장한다. */
	private String report;

	/** 도구 호출 기록 JSON. */
	private String trace;

	private String error;

	private String model;

	private Integer inputTokens;

	private Integer outputTokens;

	private Integer toolCalls;

	private LocalDateTime createdAt;

	private LocalDateTime startedAt;

	private LocalDateTime finishedAt;

	/** requestedBy 는 MANUAL 일 때 요청한 관리자, DAILY 면 null. */
	public InsightRun(Kind kind, Long requestedBy) {
		this.kind = kind;
		this.requestedBy = requestedBy;
		this.status = Status.PENDING;
		this.createdAt = Times.now();
	}

	public boolean isActive() {
		return status == Status.PENDING || status == Status.RUNNING;
	}

	public void finish(Status result, String report, String trace, String error, String model, Integer inputTokens,
		Integer outputTokens, Integer toolCalls) {
		this.status = result;
		this.report = report;
		this.trace = trace;
		this.error = error;
		this.model = model;
		this.inputTokens = inputTokens;
		this.outputTokens = outputTokens;
		this.toolCalls = toolCalls;
		this.finishedAt = Times.now();
	}

	/** 워커가 멈춰 결과를 보내지 않은 실행. */
	public void timeOut() {
		this.status = Status.FAILED;
		this.error = "분석이 제시간에 끝나지 않았습니다. 다시 요청해 주세요.";
		this.finishedAt = Times.now();
	}
}
