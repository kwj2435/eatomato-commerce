package com.eatomato.backend.admin.dashboard;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.admin.order.AdminOrderService;
import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.member.MemberRepository;
import com.eatomato.backend.order.Order;
import com.eatomato.backend.order.OrderItemRepository;
import com.eatomato.backend.order.OrderRepository;
import com.eatomato.backend.order.OrderStatus;
import com.eatomato.backend.product.ProductRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

	private static final int DAILY_DAYS = 14;

	private final OrderRepository orderRepository;
	private final OrderItemRepository orderItemRepository;
	private final MemberRepository memberRepository;
	private final ProductRepository productRepository;
	private final AdminOrderService adminOrderService;

	public DashboardResponse get() {
		LocalDate today = Times.now().toLocalDate();
		LocalDate dailyFrom = today.minusDays(DAILY_DAYS - 1);
		LocalDate monthFrom = today.withDayOfMonth(1);
		LocalDate from = dailyFrom.isBefore(monthFrom) ? dailyFrom : monthFrom;

		// 주문 규모가 작아 기간 주문을 한 번에 읽어 메모리에서 집계한다.
		List<Order> recent = orderRepository.findValidOrdersSince(from.atStartOfDay());

		Map<LocalDate, long[]> byDay = new LinkedHashMap<>();
		for (int i = 0; i < DAILY_DAYS; i++) {
			byDay.put(dailyFrom.plusDays(i), new long[] {0, 0});
		}
		long monthOrders = 0;
		long monthRevenue = 0;
		for (Order order : recent) {
			LocalDate day = order.getOrderedAt().toLocalDate();
			long[] bucket = byDay.get(day);
			if (bucket != null) {
				bucket[0]++;
				bucket[1] += order.getTotal();
			}
			if (!day.isBefore(monthFrom)) {
				monthOrders++;
				monthRevenue += order.getTotal();
			}
		}
		long[] todayBucket = byDay.get(today);

		List<DashboardResponse.DailySales> daily = new ArrayList<>();
		byDay.forEach((day, bucket) -> daily.add(new DashboardResponse.DailySales(day, bucket[0], bucket[1])));

		Map<String, Long> byStatus = new LinkedHashMap<>();
		for (OrderStatus status : OrderStatus.values()) {
			byStatus.put(status.name(), 0L);
		}
		long allOrders = 0;
		for (Object[] row : orderRepository.countByStatus()) {
			long count = ((Number) row[1]).longValue();
			byStatus.put(((OrderStatus) row[0]).name(), count);
			if (((OrderStatus) row[0]).isPaid()) {
				allOrders += count;
			}
		}

		List<DashboardResponse.TopProduct> topProducts = orderItemRepository.topSellingProducts(PageRequest.of(0, 5))
			.stream()
			.map(row -> new DashboardResponse.TopProduct(
				String.valueOf(row[0]), (String) row[1], ((Number) row[2]).longValue(), ((Number) row[3]).longValue()))
			.toList();

		return new DashboardResponse(
			new DashboardResponse.Sales(todayBucket[0], todayBucket[1]),
			new DashboardResponse.Sales(monthOrders, monthRevenue),
			new DashboardResponse.Sales(allOrders, allTimeRevenue()),
			memberRepository.count(),
			memberRepository.countByCreatedAtGreaterThanEqual(today.atStartOfDay()),
			productRepository.countByVisibleTrueAndDeletedAtIsNull(),
			productRepository.countByVisibleFalseAndDeletedAtIsNull(),
			byStatus,
			daily,
			topProducts,
			adminOrderService.withDetails(orderRepository.findTop5ByOrderByOrderedAtDescIdDesc()),
			productRepository.countByStockQuantityLessThanEqualAndDeletedAtIsNull(0));
	}

	private long allTimeRevenue() {
		return orderRepository.findValidOrdersSince(LocalDateTime.of(2000, 1, 1, 0, 0)).stream()
			.mapToLong(Order::getTotal)
			.sum();
	}
}
