package com.eatomato.backend.order;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.cart.CartItem;
import com.eatomato.backend.cart.CartItemRepository;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.order.dto.CreateOrderRequest;
import com.eatomato.backend.order.dto.OrderResponse;
import com.eatomato.backend.payment.Payment;
import com.eatomato.backend.payment.PaymentGateway;
import com.eatomato.backend.payment.PaymentRepository;
import com.eatomato.backend.payment.PaymentService;
import com.eatomato.backend.payment.PaymentStatus;
import com.eatomato.backend.product.Product;
import com.eatomato.backend.product.ProductRepository;
import com.eatomato.backend.shipping.ShippingPolicyService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 주문 생성·조회·취소.
 *
 * 흐름: 주문서 제출 → 결제대기 주문 + 재고 차감(선점) → 결제 승인(PaymentService.confirm) → 결제완료.
 * 결제대기로 30분이 지나면 자동 취소하고 재고를 돌려놓는다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

	private static final DateTimeFormatter ORDER_NUMBER_DATE = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
	private static final SecureRandom RANDOM = new SecureRandom();
	static final Duration PAYMENT_TIMEOUT = Duration.ofMinutes(30);

	private final OrderRepository orderRepository;
	private final CartItemRepository cartItemRepository;
	private final ProductRepository productRepository;
	private final PaymentRepository paymentRepository;
	private final PaymentGateway paymentGateway;
	private final OrderStatusHistoryRepository historyRepository;
	private final ShippingPolicyService shippingPolicyService;

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

		reserveStock(cartItems);

		CreateOrderRequest.Shipping s = request.shipping();
		Order order = new Order(newOrderNumber(), memberId, new ShippingAddress(
			s.recipientName().trim(), s.recipientPhone().replace("-", ""), s.zipCode(), s.roadAddress().trim(),
			blankToNull(s.detailAddress()), blankToNull(s.deliveryMemo())));
		cartItems.forEach(cartItem -> order.addItem(OrderItem.snapshotOf(cartItem)));
		order.calculate(shippingPolicyService.current());
		orderRepository.save(order);
		paymentRepository.save(new Payment(order, paymentGateway.provider(), order.getTotal()));
		historyRepository.save(new OrderStatusHistory(order.getId(), null, order.getStatus(), memberId, "주문서 제출"));
		return OrderResponse.from(order);
	}

	public List<OrderResponse> listMine(Long memberId) {
		List<Order> orders = orderRepository.findByMemberIdOrderByOrderedAtDescIdDesc(memberId);
		Map<Long, Payment> payments = paymentRepository.findByOrderIn(orders).stream()
			.collect(Collectors.toMap(payment -> payment.getOrder().getId(), Function.identity()));
		return orders.stream()
			.map(order -> OrderResponse.from(order, payments.get(order.getId())))
			.toList();
	}

	public OrderResponse getMine(Long memberId, String orderNumber) {
		Order order = findMine(memberId, orderNumber);
		return OrderResponse.from(order, paymentRepository.findByOrder(order).orElse(null));
	}

	/**
	 * 고객 취소(결제대기·입금대기·결제완료). 결제완료였다면 PG 결제를 취소한다.
	 * 무통장입금으로 입금까지 끝난 주문은 환불 계좌가 필요해 고객센터(관리자 취소)로 안내한다.
	 */
	@Transactional
	public OrderResponse cancelMine(Long memberId, String orderNumber) {
		Order order = findMine(memberId, orderNumber);
		Payment payment = paymentRepository.findByOrder(order).orElse(null);
		if (order.getStatus() == OrderStatus.PAID && payment != null && payment.isVirtualAccount()) {
			throw new ApiException(ErrorCode.CANCEL_VIA_CUSTOMER_SERVICE);
		}
		cancel(order, memberId, "고객 취소");
		return OrderResponse.from(order, payment);
	}

	/**
	 * 취소 공통 처리: 결제 취소(환불) → 재고 복원 → 판매량 되돌림 → 상태 이력.
	 * 배송이 시작된 주문은 취소할 수 없다(OrderStatus 전이 규칙).
	 */
	@Transactional
	public void cancel(Order order, Long changedBy, String reason) {
		cancel(order, changedBy, reason, null, false);
	}

	/**
	 * @param refundAccount 무통장입금으로 입금까지 끝난 주문의 고객 환불 계좌(관리자 취소). 그 밖에는 null.
	 * @param canceledAtGateway PG 에서 이미 취소된 결제(웹훅)면 true — PG 취소 API 를 다시 부르지 않는다.
	 */
	@Transactional
	public void cancel(Order order, Long changedBy, String reason, PaymentGateway.RefundAccount refundAccount,
		boolean canceledAtGateway) {
		OrderStatus before = order.getStatus();
		if (!before.isCancellable()) {
			throw new ApiException(ErrorCode.INVALID_ORDER_STATUS);
		}
		Payment payment = paymentRepository.findByOrder(order).orElse(null);
		if (payment != null) {
			if (canceledAtGateway) {
				PaymentService.markCanceled(payment);
			} else if (before == OrderStatus.PAID) {
				PaymentService.refund(paymentGateway, payment, reason, refundAccount);
			} else if (before == OrderStatus.AWAITING_DEPOSIT) {
				PaymentService.closeVirtualAccount(paymentGateway, payment, reason);
			} else {
				PaymentService.markCanceled(payment);
			}
		}
		if (before == OrderStatus.PAID) {
			order.getItems().forEach(item ->
				productRepository.findById(item.getProductId()).ifPresent(p -> p.decreaseSalesCount(item.getQuantity())));
		}
		quantitiesByProduct(order).forEach(productRepository::increaseStock);
		order.cancel();
		historyRepository.save(new OrderStatusHistory(order.getId(), before, OrderStatus.CANCELLED, changedBy, reason));
	}

	/** 관리자 상태 변경(배송중·배송완료·취소). 결제완료는 결제 승인으로만 바뀐다. */
	@Transactional
	public void changeStatusByAdmin(Order order, OrderStatus next, Long adminId,
		PaymentGateway.RefundAccount refundAccount) {
		if (!order.getStatus().nextByAdmin().contains(next)) {
			throw new ApiException(ErrorCode.INVALID_ORDER_STATUS);
		}
		if (next == OrderStatus.CANCELLED) {
			cancel(order, adminId, "관리자 취소", refundAccount, false);
			return;
		}
		OrderStatus before = order.getStatus();
		order.transitionTo(next);
		historyRepository.save(new OrderStatusHistory(order.getId(), before, next, adminId, null));
	}

	/** 결제대기로 30분이 지난 주문을 취소하고 재고를 돌려놓는다. 5분마다 돈다. */
	@Scheduled(fixedDelay = 5 * 60 * 1000, initialDelay = 60 * 1000)
	@Transactional
	public void expireUnpaidOrders() {
		List<Order> expired = orderRepository.findByStatusAndOrderedAtBefore(OrderStatus.PENDING_PAYMENT,
			Times.now().minus(PAYMENT_TIMEOUT));
		expired.forEach(order -> cancel(order, null, "결제 시간 초과"));
		if (!expired.isEmpty()) {
			log.info("결제대기 만료 취소: {}건", expired.size());
		}

		// 무통장입금 기한이 지난 입금대기 주문도 취소해 재고를 돌려놓는다.
		List<Payment> overdue = paymentRepository.findByStatusAndVaDueAtBefore(PaymentStatus.WAITING_FOR_DEPOSIT,
			Times.now());
		overdue.stream()
			.map(Payment::getOrder)
			.filter(order -> order.getStatus() == OrderStatus.AWAITING_DEPOSIT)
			.forEach(order -> cancel(order, null, "입금 기한 만료"));
		if (!overdue.isEmpty()) {
			log.info("입금 기한 만료 취소: {}건", overdue.size());
		}
	}

	/**
	 * 재고 선점. 상품별로 합친 수량을 조건부 UPDATE 로 한 번에 차감한다.
	 * 하나라도 모자라면 예외로 트랜잭션 전체(앞서 차감한 것 포함)가 되돌아간다.
	 */
	private void reserveStock(List<CartItem> cartItems) {
		Map<Long, Integer> quantities = new LinkedHashMap<>();
		Map<Long, Product> products = new LinkedHashMap<>();
		for (CartItem item : cartItems) {
			quantities.merge(item.getProduct().getId(), item.getQuantity(), Integer::sum);
			products.put(item.getProduct().getId(), item.getProduct());
		}
		quantities.forEach((productId, quantity) -> {
			Product product = products.get(productId);
			if (product.getStockQuantity() == null) {
				return;
			}
			if (productRepository.decreaseStock(productId, quantity) == 0) {
				throw new ApiException(ErrorCode.INSUFFICIENT_STOCK,
					"'" + product.getName() + "' 재고가 부족합니다. 장바구니에서 수량을 줄여 주세요.");
			}
		});
	}

	private static Map<Long, Integer> quantitiesByProduct(Order order) {
		Map<Long, Integer> quantities = new LinkedHashMap<>();
		order.getItems().forEach(item -> quantities.merge(item.getProductId(), item.getQuantity(), Integer::sum));
		return quantities;
	}

	private Order findMine(Long memberId, String orderNumber) {
		return orderRepository.findByOrderNumberAndMemberId(orderNumber, memberId)
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

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}
}
