package com.eatomato.backend.payment;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

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

		// 이미 같은 결제로 확정(또는 무통장입금 계좌 발급)된 주문이면 그대로 돌려준다(중복 요청·새로고침).
		if ((payment.getStatus() == PaymentStatus.DONE || payment.getStatus() == PaymentStatus.WAITING_FOR_DEPOSIT)
			&& paymentKey.equals(payment.getPaymentKey())) {
			return OrderResponse.from(order, payment);
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

		// 주문을 마쳤으니 장바구니에서 같은 줄을 지운다(무통장입금도 계좌를 받은 시점에 지운다).
		order.getItems().forEach(item -> {
			if (item.getOptionKey() != null) {
				cartItemRepository.deleteByMemberIdAndProductIdAndOptionKey(order.getMemberId(), item.getProductId(),
					item.getOptionKey());
			}
		});

		if (approval.virtualAccount() != null) {
			payment.awaitDeposit(approval.paymentKey(), approval.method(), approval.secret(), approval.virtualAccount());
			order.markAwaitingDeposit();
			historyRepository.save(new OrderStatusHistory(order.getId(), OrderStatus.PENDING_PAYMENT,
				OrderStatus.AWAITING_DEPOSIT, null, "무통장입금 계좌 발급 (" + payment.getProvider() + ")"));
			return OrderResponse.from(order, payment);
		}

		payment.approve(approval.paymentKey(), approval.method());
		order.markPaid();
		increaseSalesCount(order);
		historyRepository.save(new OrderStatusHistory(order.getId(), OrderStatus.PENDING_PAYMENT, OrderStatus.PAID,
			null, "결제 승인 (" + payment.getProvider() + ")"));
		return OrderResponse.from(order, payment);
	}

	/**
	 * 무통장입금 웹훅(DEPOSIT_CALLBACK). secret 이 승인 때 받은 값과 같아야 믿는다.
	 * DONE: 입금 확인 → 결제완료. CANCELED: PG 에서 취소된 가상계좌 → 주문 취소.
	 *
	 * @throws ApiException INVALID_WEBHOOK 주문이 없거나 secret 이 다를 때
	 */
	@Transactional
	public void handleDeposit(String orderNumber, String secret, String status) {
		Order order = orderRepository.findByOrderNumber(orderNumber)
			.orElseThrow(() -> new ApiException(ErrorCode.INVALID_WEBHOOK));
		Payment payment = paymentRepository.findByOrder(order)
			.orElseThrow(() -> new ApiException(ErrorCode.INVALID_WEBHOOK));
		if (payment.getSecret() == null || secret == null || !MessageDigest.isEqual(
			payment.getSecret().getBytes(StandardCharsets.UTF_8), secret.getBytes(StandardCharsets.UTF_8))) {
			throw new ApiException(ErrorCode.INVALID_WEBHOOK);
		}

		if ("DONE".equals(status)) {
			if (order.getStatus() != OrderStatus.AWAITING_DEPOSIT) {
				// 이미 처리한 알림(재전송)이면 조용히 넘어간다. 취소된 주문에 입금됐다면 수동 환불이 필요하다.
				if (order.getStatus() == OrderStatus.CANCELLED) {
					log.error("취소된 주문에 입금 알림: 주문 {} — 상점관리자에서 확인·환불 필요", orderNumber);
				}
				return;
			}
			payment.deposited();
			order.markPaid();
			increaseSalesCount(order);
			historyRepository.save(new OrderStatusHistory(order.getId(), OrderStatus.AWAITING_DEPOSIT, OrderStatus.PAID,
				null, "무통장입금 확인"));
		} else if ("CANCELED".equals(status) && order.getStatus().isCancellable()) {
			orderService.cancel(order, null, "PG 에서 취소됨", null, true);
		}
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
		orderService.cancel(order, null, "PG 에서 취소됨", null, true);
	}

	/**
	 * 결제완료 주문 취소 시 PG 환불. PG 가 거절하면 예외로 트랜잭션을 되돌려 주문은 결제완료로 남는다.
	 * 무통장입금으로 받은 결제는 고객 환불 계좌(refundAccount)가 있어야 한다.
	 */
	public static void refund(PaymentGateway gateway, Payment payment, String reason,
		PaymentGateway.RefundAccount refundAccount) {
		// 0원 결제(쿠폰·적립금 전액)는 PG 를 거치지 않았으니 PG 취소도 없다.
		if (payment.getStatus() == PaymentStatus.DONE && payment.getAmount() > 0) {
			if (payment.isVirtualAccount() && refundAccount == null) {
				throw new ApiException(ErrorCode.REFUND_ACCOUNT_REQUIRED);
			}
			try {
				gateway.cancel(payment.getPaymentKey(), payment.getAmount(), reason, refundAccount);
			} catch (PaymentGateway.PaymentGatewayException e) {
				throw new ApiException(ErrorCode.PAYMENT_CANCEL_FAILED, e.getMessage());
			}
		}
		payment.cancel();
	}

	/**
	 * 입금 전 무통장입금 주문 취소: PG 의 가상계좌를 닫아 늦은 입금을 막는다.
	 * 받은 돈이 없으니 PG 가 거절해도(이미 만료 등) 주문 취소는 진행하고 로그만 남긴다.
	 */
	public static void closeVirtualAccount(PaymentGateway gateway, Payment payment, String reason) {
		if (payment.getStatus() == PaymentStatus.WAITING_FOR_DEPOSIT) {
			try {
				gateway.cancel(payment.getPaymentKey(), payment.getAmount(), reason, null);
			} catch (PaymentGateway.PaymentGatewayException e) {
				log.warn("가상계좌 닫기 실패(주문 취소는 진행): {} ({})", payment.getPaymentKey(), e.getMessage());
			}
		}
		payment.cancel();
	}

	private void increaseSalesCount(Order order) {
		order.getItems().forEach(item -> productRepository.findById(item.getProductId())
			.ifPresent(p -> p.increaseSalesCount(item.getQuantity())));
	}

	/** 쿠폰·적립금으로 결제할 금액이 0원인 주문: PG 없이 결제완료로 기록한다. */
	public static void approveWithoutGateway(Payment payment) {
		payment.approve(null, "쿠폰·적립금");
	}

	/** 결제 전에 취소된 주문의 결제 기록 정리. */
	public static void markCanceled(Payment payment) {
		payment.cancel();
	}
}
