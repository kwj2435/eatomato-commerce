package com.eatomato.backend.admin.briefing;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.admin.briefing.BriefingFacts.Day;
import com.eatomato.backend.admin.briefing.BriefingFacts.ReviewItem;
import com.eatomato.backend.admin.briefing.BriefingFacts.StockItem;
import com.eatomato.backend.analytics.PageViewRepository;
import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.order.Order;
import com.eatomato.backend.order.OrderItemRepository;
import com.eatomato.backend.order.OrderRepository;
import com.eatomato.backend.order.OrderStatus;
import com.eatomato.backend.order.OrderStatusHistoryRepository;
import com.eatomato.backend.payment.PaymentRepository;
import com.eatomato.backend.payment.PaymentStatus;
import com.eatomato.backend.product.Product;
import com.eatomato.backend.product.ProductRepository;
import com.eatomato.backend.review.ReviewRepository;

import lombok.RequiredArgsConstructor;

/**
 * 운영 브리핑: 지금 처리할 주문·재고·후기와 어제 실적을 모아 할 일 목록으로 돌려준다.
 * 숫자는 모두 DB 에서 계산하고(BriefingFacts), 무엇이 급한지는 BriefingRules 가 정한다.
 * 화면을 열 때마다 새로 계산한다(쿼리 몇 개라 저장하지 않는다).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminBriefingService {

	/** 후기 본문은 이 글자 수까지만 보여준다. */
	static final int EXCERPT_LENGTH = 80;

	private final OrderRepository orderRepository;
	private final OrderItemRepository orderItemRepository;
	private final OrderStatusHistoryRepository historyRepository;
	private final PaymentRepository paymentRepository;
	private final ProductRepository productRepository;
	private final ReviewRepository reviewRepository;
	private final PageViewRepository pageViewRepository;

	public BriefingResponse get() {
		BriefingFacts facts = collect(Times.now());
		return new BriefingResponse(Times.toOffset(facts.now()), facts.yesterday(), facts.sameDayLastWeek(),
			BriefingRules.evaluate(facts));
	}

	BriefingFacts collect(LocalDateTime now) {
		LocalDate today = now.toLocalDate();
		LocalDate yesterday = today.minusDays(1);
		LocalDate sameDayLastWeek = yesterday.minusDays(7);

		long preparing = orderRepository.countWithStatus(OrderStatus.PREPARING);
		long preparingWithoutTracking = orderRepository.countPreparingWithoutTracking();

		long paidCancels = 0;
		long unpaidCancels = 0;
		for (Object[] row : historyRepository.countCancelledByFromStatus(yesterday.atStartOfDay(), today.atStartOfDay())) {
			long count = ((Number) row[1]).longValue();
			if (row[0] instanceof OrderStatus from && from.isPaid()) {
				paidCancels += count;
			} else {
				unpaidCancels += count;
			}
		}

		// 주문 규모가 작아 2주 치 결제 주문을 한 번에 읽어 날짜별로 센다(대시보드와 같은 방식).
		List<Order> orders = orderRepository.findValidOrdersSince(sameDayLastWeek.atStartOfDay());

		return new BriefingFacts(
			now,
			orderRepository.countWithStatus(OrderStatus.PAID),
			orderRepository.findOldestPaidAt(OrderStatus.PAID),
			preparingWithoutTracking,
			preparing - preparingWithoutTracking,
			paymentRepository.countByStatusAndVaDueAtBetween(PaymentStatus.WAITING_FOR_DEPOSIT, now,
				now.plus(BriefingRules.DEPOSIT_DUE_WITHIN)),
			lowStock(now),
			lowReviews(now),
			paidCancels,
			unpaidCancels,
			day(yesterday, orders),
			day(sameDayLastWeek, orders));
	}

	private List<StockItem> lowStock(LocalDateTime now) {
		List<Product> products = productRepository.findLowStock(BriefingRules.LOW_STOCK);
		if (products.isEmpty()) {
			return List.of();
		}
		Map<Long, Long> sold = orderItemRepository
			.paidQuantitiesSince(now.minusDays(7), products.stream().map(Product::getId).toList())
			.stream()
			.collect(Collectors.toMap(row -> ((Number) row[0]).longValue(), row -> ((Number) row[1]).longValue()));
		return products.stream()
			.map(p -> new StockItem(p.getId(), p.getName(), p.getStockQuantity(), sold.getOrDefault(p.getId(), 0L)))
			.toList();
	}

	private List<ReviewItem> lowReviews(LocalDateTime now) {
		return reviewRepository
			.findByRatingLessThanEqualAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(BriefingRules.LOW_RATING,
				now.minus(BriefingRules.REVIEW_LOOKBACK))
			.stream()
			.map(r -> new ReviewItem(r.getProduct().getName(), r.getProduct().getSlug(), r.getRating(),
				excerpt(r.getContent())))
			.toList();
	}

	private Day day(LocalDate date, List<Order> orders) {
		long count = 0;
		long revenue = 0;
		for (Order order : orders) {
			if (order.getOrderedAt().toLocalDate().equals(date)) {
				count++;
				revenue += order.getTotal();
			}
		}
		List<Object[]> totals = pageViewRepository.totals(date.atStartOfDay(), date.plusDays(1).atStartOfDay());
		long visitors = totals.isEmpty() || totals.get(0)[0] == null ? 0 : ((Number) totals.get(0)[0]).longValue();
		return new Day(date, count, revenue, visitors);
	}

	/** 줄바꿈을 공백으로 바꾸고 EXCERPT_LENGTH 자에서 자른다. */
	static String excerpt(String content) {
		if (content == null) {
			return "";
		}
		String flat = content.replaceAll("\\s+", " ").strip();
		return flat.length() <= EXCERPT_LENGTH ? flat : flat.substring(0, EXCERPT_LENGTH) + "…";
	}
}
