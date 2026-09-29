package com.eatomato.backend.payment;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.cart.CartItemRepository;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.order.Order;
import com.eatomato.backend.order.OrderRepository;
import com.eatomato.backend.order.OrderService;
import com.eatomato.backend.order.OrderStatus;
import com.eatomato.backend.order.OrderStatusHistory;
import com.eatomato.backend.order.OrderStatusHistoryRepository;
import com.eatomato.backend.order.dto.OrderResponse;
import com.eatomato.backend.product.ProductRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 결제 승인. PG 결제창이 돌려보낸 값(paymentKey·주문번호·금액)으로 결제를 확정하고 주문을 결제완료로 바꾼다.
 * 같은 요청이 두 번 와도(새로고침·웹훅 중복) 한 번만 처리된다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

	private final OrderRepository orderRepository;
	private final PaymentRepository paymentRepository;
	private final PaymentGateway paymentGateway;
	private final ProductRepository productRepository;
	private final CartItemRepository cartItemRepository;
	private final OrderStatusHistoryRepository historyRepository;
	private final OrderService orderService;

	/**
	 * @param memberId 고객 요청이면 본인 주문인지 확인한다. 웹훅(PG 서버 호출)이면 null.
	 */
	@Transactional
	public OrderResponse confirm(Long memberId, String orderNumber, String paymentKey, int amount) {
		Order order = (memberId == null
			? orderRepository.findByOrderNumber(orderNumber)
			: orderRepository.findByOrderNumberAndMemberId(orderNumber, memberId))
			.orElseThrow(() -> new ApiException(ErrorCode.ORDER_NOT_FOUND));
		Payment payment = paymentRepository.findByOrder(order)
			.orElseThrow(() -> new ApiException(ErrorCode.ORDER_NOT_FOUND));

		// 이미 같은 결제로 확정된 주문이면 그대로 돌려준다(중복 요청).
		if (payment.getStatus() == PaymentStatus.DONE && paymentKey.equals(payment.getPaymentKey())) {
			return OrderResponse.from(order);
		}
		if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
			throw new ApiException(ErrorCode.INVALID_ORDER_STATUS);
		}
		// 클라이언트가 보낸 금액이 서버가 계산한 주문 금액과 같아야 한다(금액 위변조 방지).
		if (amount != order.getTotal()) {
			throw new ApiException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
		}

		PaymentGateway.PaymentApproval approval;
		try {
			approval = paymentGateway.confirm(paymentKey, orderNumber, order.getTotal());
		} catch (PaymentGateway.PaymentGatewayException e) {
			payment.fail(e.getMessage());
			log.warn("결제 승인 실패: 주문 {} ({})", orderNumber, e.getMessage());
			throw new ApiException(ErrorCode.PAYMENT_FAILED, e.getMessage());
		}
		if (approval.approvedAmount() != order.getTotal()) {
			throw new ApiException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
		}

		payment.approve(approval.paymentKey());
		order.markPaid();
		order.getItems().forEach(item -> {
			productRepository.findById(item.getProductId()).ifPresent(p -> p.increaseSalesCount(item.getQuantity()));
			if (item.getOptionKey() != null) {
				cartItemRepository.deleteByMemberIdAndProductIdAndOptionKey(order.getMemberId(), item.getProductId(),
					item.getOptionKey());
			}
		});
		historyRepository.save(new OrderStatusHistory(order.getId(), OrderStatus.PENDING_PAYMENT, OrderStatus.PAID,
			null, "결제 승인 (" + payment.getProvider() + ")"));
		return OrderResponse.from(order);
	}

	/**
	 * PG 쪽에서 취소된 결제(상점관리자에서 직접 취소 등)를 주문에 반영한다. 웹훅이 PG 조회로 확인한 뒤 부른다.
	 * 이미 취소됐거나 배송이 시작된 주문은 건드리지 않는다.
	 */
	@Transactional
	public void cancelByGateway(String orderNumber, String paymentKey) {
		Order order = orderRepository.findByOrderNumber(orderNumber).orElse(null);
		Payment payment = order == null ? null : paymentRepository.findByOrder(order).orElse(null);
		if (payment == null || !paymentKey.equals(payment.getPaymentKey())) {
			return;
		}
		if (!order.getStatus().isCancellable()) {
			if (order.getStatus() != OrderStatus.CANCELLED) {
				log.warn("PG 에서 취소됐지만 주문 상태가 {} 라 자동 취소하지 않음: 주문 {}", order.getStatus(), orderNumber);
			}
			return;
		}
		orderService.cancel(order, null, "PG 에서 취소됨");
	}

	/** 결제완료 주문 취소 시 PG 환불. PG 가 거절하면 예외로 트랜잭션을 되돌려 주문은 결제완료로 남는다. */
	public static void refund(PaymentGateway gateway, Payment payment, String reason) {
		if (payment.getStatus() == PaymentStatus.DONE) {
			try {
				gateway.cancel(payment.getPaymentKey(), payment.getAmount(), reason);
			} catch (PaymentGateway.PaymentGatewayException e) {
				throw new ApiException(ErrorCode.PAYMENT_CANCEL_FAILED);
			}
		}
		payment.cancel();
	}

	/** 결제 전에 취소된 주문의 결제 기록 정리. */
	public static void markCanceled(Payment payment) {
		payment.cancel();
	}
}
