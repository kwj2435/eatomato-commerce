package com.eatomato.backend.analytics;

import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.analytics.AnalyticsEvent.Type;
import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.order.Order;
import com.eatomato.backend.order.OrderRepository;
import com.eatomato.backend.product.ProductRepository;

import lombok.RequiredArgsConstructor;

/**
 * 구매 단계 이벤트를 기록한다. 페이지 조회와 같이 검색 로봇은 건너뛰고, 실패해도 응답은 같다(화면에 영향 없음).
 * 결제 완료는 주문번호로 실제 결제된 주문인지 확인하고, 금액은 주문에서 읽는다(요청을 믿지 않는다).
 */
@Service
@RequiredArgsConstructor
public class AnalyticsEventService {

	private static final Pattern BOT = Pattern.compile(
		"bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|yeti|daumoa|curl|wget|python|java/|okhttp",
		Pattern.CASE_INSENSITIVE);

	private final AnalyticsEventRepository eventRepository;
	private final ProductRepository productRepository;
	private final OrderRepository orderRepository;

	@Transactional
	public void record(AnalyticsEventRequest request, String userAgent) {
		if (userAgent == null || userAgent.isBlank() || BOT.matcher(userAgent).find()) {
			return;
		}
		String visitor = request.visitorId().toLowerCase(Locale.ROOT);
		String session = request.sessionId().toLowerCase(Locale.ROOT);

		AnalyticsEvent event = switch (request.type()) {
			case ADD_TO_CART -> addToCart(visitor, session, request);
			case CHECKOUT_START, PURCHASE -> orderEvent(visitor, session, request);
		};
		if (event == null) {
			return;
		}
		try {
			eventRepository.saveAndFlush(event);
		} catch (DataIntegrityViolationException duplicate) {
			// 같은 주문의 결제 완료가 동시에 두 번 들어온 경우. 먼저 들어온 것만 남긴다.
		}
	}

	private AnalyticsEvent addToCart(String visitor, String session, AnalyticsEventRequest request) {
		if (request.productId() == null || !productRepository.existsById(request.productId())) {
			return null;
		}
		int quantity = request.quantity() == null ? 1 : request.quantity();
		return new AnalyticsEvent(visitor, session, Type.ADD_TO_CART, request.productId(), null, quantity, Times.now());
	}

	private AnalyticsEvent orderEvent(String visitor, String session, AnalyticsEventRequest request) {
		if (request.orderNumber() == null || request.orderNumber().isBlank()) {
			return null;
		}
		Order order = orderRepository.findByOrderNumber(request.orderNumber().trim()).orElse(null);
		if (order == null) {
			return null;
		}
		Type type = request.type();
		if (type == Type.PURCHASE && order.getPaidAt() == null) {
			return null;
		}
		if (eventRepository.existsByEventTypeAndOrderNumber(type.name(), order.getOrderNumber())) {
			return null;
		}
		return new AnalyticsEvent(visitor, session, type, null, order.getOrderNumber(), order.getTotal(),
			Times.now());
	}
}
