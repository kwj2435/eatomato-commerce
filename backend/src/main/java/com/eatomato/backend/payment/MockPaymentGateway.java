package com.eatomato.backend.payment;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * PG 연동 전 임시 구현: 결제가 항상 성공했다고 본다.
 * app.payment.provider 를 다른 값(예: toss)으로 바꾸고 그 구현을 등록하면 교체된다.
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.payment", name = "provider", havingValue = "mock", matchIfMissing = true)
public class MockPaymentGateway implements PaymentGateway {

	@Override
	public String provider() {
		return "MOCK";
	}

	@Override
	public PaymentApproval confirm(String paymentKey, String orderNumber, int amount) {
		log.info("[MOCK PG] 결제 승인 가정: 주문 {} / {}원", orderNumber, amount);
		return PaymentApproval.paid(paymentKey, amount, "MOCK");
	}

	@Override
	public void cancel(String paymentKey, int amount, String reason, RefundAccount refundAccount) {
		log.info("[MOCK PG] 결제 취소 가정: {} / {}원 ({})", paymentKey, amount, reason);
	}
}
