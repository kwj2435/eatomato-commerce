package com.eatomato.backend.order;

import java.security.SecureRandom;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.cart.CartItem;
import com.eatomato.backend.cart.CartItemRepository;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.order.dto.CreateOrderRequest;
import com.eatomato.backend.order.dto.OrderResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

	private static final DateTimeFormatter ORDER_NUMBER_DATE = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
	private static final SecureRandom RANDOM = new SecureRandom();

	private final OrderRepository orderRepository;
	private final CartItemRepository cartItemRepository;

	/**
	 * 장바구니 항목으로 주문을 만든다.
	 *
	 * 결제(PG) 연동 전이라 주문은 생성 즉시 결제 완료(PAID)로 기록한다.
	 * 네이버페이·토스페이 등을 붙이면 여기서 결제 대기 주문을 만들고, 승인 콜백에서 PAID 로 바꾸는 흐름이 된다.
	 */
	@Transactional
	public OrderResponse create(Long memberId, CreateOrderRequest request) {
		List<CartItem> cartItems = request.cartItemIds() == null || request.cartItemIds().isEmpty()
			? cartItemRepository.findByMemberIdAndSelectedTrue(memberId)
			: cartItemRepository.findByMemberIdAndIdIn(memberId, request.cartItemIds());
		if (cartItems.isEmpty()) {
			throw new ApiException(ErrorCode.EMPTY_ORDER);
		}
		if (cartItems.stream().anyMatch(item -> !item.getProduct().isOnSale())) {
			throw new ApiException(ErrorCode.PRODUCT_UNAVAILABLE);
		}

		Order order = new Order(newOrderNumber(), memberId);
		for (CartItem cartItem : cartItems) {
			order.addItem(OrderItem.snapshotOf(cartItem));
			cartItem.getProduct().increaseSalesCount(cartItem.getQuantity());
		}
		orderRepository.save(order);
		cartItemRepository.deleteAll(cartItems);
		return OrderResponse.from(order);
	}

	public List<OrderResponse> listMine(Long memberId) {
		return orderRepository.findByMemberIdOrderByOrderedAtDescIdDesc(memberId).stream()
			.map(OrderResponse::from)
			.toList();
	}

	public OrderResponse getMine(Long memberId, String orderNumber) {
		return orderRepository.findByOrderNumberAndMemberId(orderNumber, memberId)
			.map(OrderResponse::from)
			.orElseThrow(() -> new ApiException(ErrorCode.ORDER_NOT_FOUND));
	}

	/** 주문번호: 주문 시각(14자리) + 난수 4자리. */
	private String newOrderNumber() {
		String candidate;
		do {
			candidate = Times.now().format(ORDER_NUMBER_DATE) + String.format("%04d", RANDOM.nextInt(10_000));
		} while (orderRepository.existsByOrderNumber(candidate));
		return candidate;
	}
}
