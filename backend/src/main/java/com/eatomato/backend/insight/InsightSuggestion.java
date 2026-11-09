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

/** 개선 제안 하나. 에이전트가 만들고 관리자가 상태를 바꾼다. */
@Entity
@Table(name = "insight_suggestion")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InsightSuggestion {

	public enum Category {
		PLANNING, DESIGN, MARKETING, OPERATIONS
	}

	/** NEW·ADOPTED·ON_HOLD 는 아직 열린 제안(에이전트가 중복을 피하고 다시 확인한다). */
	public enum Status {
		NEW, ADOPTED, ON_HOLD, DISMISSED, DONE;

		public boolean isOpen() {
			return this == NEW || this == ADOPTED || this == ON_HOLD;
		}
	}

	public enum Level {
		LOW, MEDIUM, HIGH
	}

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long runId;

	@Enumerated(EnumType.STRING)
	private Category category;

	private String title;

	private String problem;

	private String proposal;

	/** 근거 [{metric, value}] JSON. */
	private String evidence;

	private String metric;

	@Enumerated(EnumType.STRING)
	private Level impact;

	@Enumerated(EnumType.STRING)
	private Level effort;

	@Enumerated(EnumType.STRING)
	private Level confidence;

	@Enumerated(EnumType.STRING)
	private Status status;

	private LocalDateTime statusChangedAt;

	private LocalDateTime doneAt;

	private int reconfirmCount;

	private String reconfirmNote;

	private LocalDateTime reconfirmedAt;

	/** 완료 뒤 효과 확인 {verdict, summary, evidence} JSON. */
	private String followUp;

	private LocalDateTime followUpAt;

	private LocalDateTime createdAt;

	public InsightSuggestion(Long runId, Category category, String title, String problem, String proposal,
		String evidence, String metric, Level impact, Level effort, Level confidence) {
		this.runId = runId;
		this.category = category;
		this.title = title;
		this.problem = problem;
		this.proposal = proposal;
		this.evidence = evidence;
		this.metric = metric;
		this.impact = impact;
		this.effort = effort;
		this.confidence = confidence;
		this.status = Status.NEW;
		this.createdAt = Times.now();
	}

	/** 완료로 바꾸면 효과 확인 기준 시각(doneAt)을 새로 잡고, 완료에서 다른 상태로 되돌리면 확인 결과를 지운다. */
	public void changeStatus(Status next) {
		if (next == status) {
			return;
		}
		if (next == Status.DONE) {
			this.doneAt = Times.now();
		} else if (status == Status.DONE) {
			this.doneAt = null;
			this.followUp = null;
			this.followUpAt = null;
		}
		this.status = next;
		this.statusChangedAt = Times.now();
	}

	public void reconfirm(String note) {
		this.reconfirmCount++;
		this.reconfirmNote = note;
		this.reconfirmedAt = Times.now();
	}

	public boolean isFollowUpDue(LocalDateTime cutoff) {
		return status == Status.DONE && followUp == null && doneAt != null && !doneAt.isAfter(cutoff);
	}

	public void recordFollowUp(String json) {
		this.followUp = json;
		this.followUpAt = Times.now();
	}
}
