package com.eatomato.backend.insight;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.analytics.AnalyticsEventRepository;
import com.eatomato.backend.analytics.PageViewRepository;
import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.order.OrderRepository;
import com.eatomato.backend.product.ProductRepository;
import com.eatomato.backend.review.ReviewRepository;

import lombok.RequiredArgsConstructor;

/**
 * 인사이트 원자료(InsightDataset) 만들기. 방문 기록은 3개월만 남으므로 기간은 최대 90일.
 * 주문 규모가 작아 기간 데이터를 한 번에 읽는다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InsightDatasetService {

	static final int MAX_DAYS = 90;
	private static final int EXCERPT_LENGTH = 120;

	private final PageViewRepository pageViewRepository;
	private final AnalyticsEventRepository eventRepository;
	private final OrderRepository orderRepository;
	private final ProductRepository productRepository;
	private final ReviewRepository reviewRepository;
	private final InsightProperties properties;

	public InsightDataset build(int days) {
		LocalDateTime to = Times.now();
		LocalDateTime from = to.toLocalDate().minusDays(Math.clamp(days, 1, MAX_DAYS) - 1L).atStartOfDay();

		List<InsightDataset.PageViewRow> pageViews = pageViewRepository.findByViewedAtGreaterThanEqual(from).stream()
			.map(v -> new InsightDataset.PageViewRow(v.getVisitorId(), v.getSessionId(), v.getViewedAt(), v.getPageType(),
				v.getProductId(), v.isSessionStart(), v.getReferrerHost(), v.getCampaign(), v.getDevice()))
			.toList();

		List<InsightDataset.EventRow> events = eventRepository.findByOccurredAtGreaterThanEqual(from).stream()
			.map(e -> new InsightDataset.EventRow(e.getVisitorId(), e.getSessionId(), e.getEventType(), e.getProductId(),
				e.getAmount(), e.getOccurredAt()))
			.toList();

		List<InsightDataset.OrderRow> orders = orderRepository.findByOrderedAtGreaterThanEqual(from).stream()
			.map(o -> new InsightDataset.OrderRow(o.getOrderedAt(), o.getPaidAt(), o.getStatus().name(), o.getTotal(),
				o.getSubtotal(), o.getShippingFee(), o.getCouponDiscount(), o.getPointUsed(), o.isGuest(),
				o.isGuest() ? null : buyerKey(o.getMemberId()),
				o.getItems().stream()
					.map(i -> new InsightDataset.ItemRow(i.getProductId(), i.getProductName(), i.getQuantity(),
						i.getUnitPrice()))
					.toList()))
			.toList();

		Map<Long, Long> reviewCounts = reviewRepository.countGroupByProduct().stream()
			.collect(Collectors.toMap(row -> ((Number) row[0]).longValue(), row -> ((Number) row[1]).longValue()));
		List<InsightDataset.ProductRow> products = productRepository.findAllForAdmin().stream()
			.map(p -> new InsightDataset.ProductRow(p.getId(), p.getName(), p.getCategoryCode(), p.getSubcategoryCode(),
				p.getPrice(), p.getSalePrice(), p.getStockQuantity(), p.isVisible(), p.getRating(),
				reviewCounts.getOrDefault(p.getId(), 0L), p.getSalesCount(), p.getCreatedAt()))
			.toList();

		List<InsightDataset.ReviewRow> reviews = reviewRepository.findByCreatedAtGreaterThanEqual(from).stream()
			.map(r -> new InsightDataset.ReviewRow(r.getProduct().getId(), r.getRating(), !r.getImages().isEmpty(),
				excerpt(r.getContent()), r.getCreatedAt()))
			.toList();

		return new InsightDataset(from, to, pageViews, events, orders, products, reviews);
	}

	/** 회원 id 를 공유 토큰으로 HMAC 해 앞 16자만 쓴다. 같은 회원은 같은 값이지만 거꾸로 회원을 알 수는 없다. */
	String buyerKey(Long memberId) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(properties.agentToken().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
			byte[] digest = mac.doFinal(String.valueOf(memberId).getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest).substring(0, 16);
		} catch (GeneralSecurityException e) {
			throw new IllegalStateException("HmacSHA256 을 쓸 수 없습니다", e);
		}
	}

	private static String excerpt(String content) {
		if (content == null) {
			return "";
		}
		String flat = content.replaceAll("\\s+", " ").strip();
		return flat.length() <= EXCERPT_LENGTH ? flat : flat.substring(0, EXCERPT_LENGTH) + "…";
	}
}
