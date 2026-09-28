package com.eatomato.backend.admin.dashboard;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.eatomato.backend.admin.order.AdminOrderResponse;

/**
 * 관리자 대시보드. 매출은 취소 주문을 뺀 결제 금액 합계(배송비 포함)다.
 */
public record DashboardResponse(
	Sales today,
	Sales thisMonth,
	Sales allTime,
	long totalMembers,
	long newMembersToday,
	long onSaleProducts,
	long hiddenProducts,
	Map<String, Long> ordersByStatus,
	List<DailySales> dailySales,
	List<TopProduct> topProducts,
	List<AdminOrderResponse> recentOrders
) {

	public record Sales(long orders, long revenue) {
	}

	/** 최근 14일, 오래된 날부터. 주문이 없는 날도 0 으로 채운다. */
	public record DailySales(LocalDate date, long orders, long revenue) {
	}

	public record TopProduct(String productId, String name, long quantity, long revenue) {
	}
}
