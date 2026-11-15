package com.eatomato.backend.analytics;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 끝난 달 하나의 방문·구매 합계. 원본 기록이 보관 기간(13개월) 뒤 지워져도 월별·연도별 추세를 볼 수 있게 남긴다.
 * 합계 숫자만 두고 방문자·방문 ID, 주문번호는 두지 않는다.
 */
@Entity
@Table(name = "analytics_monthly")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnalyticsMonthly {

	/** 그달 1일. */
	@Id
	private LocalDate monthStart;

	/** 그달 기록이 시작된 날(1일보다 늦으면 한 달 전체가 아니다). */
	private LocalDate dataFrom;

	private long visitors;

	private long sessions;

	private long pageViews;

	private long productSessions;

	private long cartSessions;

	private long checkoutPageSessions;

	private long checkoutStartSessions;

	private long purchaseSessions;

	private long purchases;

	private long revenue;

	private LocalDateTime createdAt;

	AnalyticsMonthly(MonthlyStats stats, LocalDateTime createdAt) {
		this.monthStart = stats.monthStart();
		this.dataFrom = stats.dataFrom();
		this.visitors = stats.visitors();
		this.sessions = stats.sessions();
		this.pageViews = stats.pageViews();
		this.productSessions = stats.productSessions();
		this.cartSessions = stats.cartSessions();
		this.checkoutPageSessions = stats.checkoutPageSessions();
		this.checkoutStartSessions = stats.checkoutStartSessions();
		this.purchaseSessions = stats.purchaseSessions();
		this.purchases = stats.purchases();
		this.revenue = stats.revenue();
		this.createdAt = createdAt;
	}

	public MonthlyStats toStats() {
		return new MonthlyStats(monthStart, dataFrom, visitors, sessions, pageViews, productSessions, cartSessions,
			checkoutPageSessions, checkoutStartSessions, purchaseSessions, purchases, revenue);
	}
}
