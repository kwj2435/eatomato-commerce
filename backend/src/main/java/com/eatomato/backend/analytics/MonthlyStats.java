package com.eatomato.backend.analytics;

import java.time.LocalDate;

/**
 * 한 달의 방문·구매 합계. 끝난 달은 analytics_monthly 에서, 이번 달은 원본 기록에서 바로 센다.
 * 방문자 수는 그달 안에서 서로 다른 브라우저 수라서 여러 달을 더하면 같은 사람이 겹쳐 세진다.
 */
public record MonthlyStats(
	LocalDate monthStart,
	/** 그달 기록이 시작된 날. 1일보다 늦으면 한 달 전체가 아니다. */
	LocalDate dataFrom,
	long visitors,
	long sessions,
	long pageViews,
	long productSessions,
	long cartSessions,
	long checkoutPageSessions,
	long checkoutStartSessions,
	long purchaseSessions,
	long purchases,
	long revenue
) {
}
