package com.eatomato.backend.payment;

import java.time.LocalDateTime;

/**
 * PG(결제대행사) 연동 지점. 실제 PG(토스페이먼츠·네이버페이 등)를 붙일 때 이 인터페이스를 구현한다.
 *
 * 일반적인 흐름: 프론트가 PG 결제창을 띄움 → PG 가 successUrl 로 paymentKey·orderId·amount 를 붙여 돌려보냄
 * → 프론트가 /api/payments/confirm 을 부름 → 서버가 여기 confirm 으로 PG 승인 API 를 호출해 확정한다.
 * 가상계좌 입금 같은 비동기 결과는 PG 가 /api/payments/webhook 으로 알려 준다.
 */
public interface PaymentGateway {

	/** 결제 기록에 남는 PG 이름. 예: MOCK, TOSS */
	String provider();

	/**
	 * 결제 승인. 금액은 서버가 계산한 주문 금액이다(클라이언트 값은 이미 대조 끝).
	 *
	 * @throws PaymentGatewayException 승인 거절·통신 실패
	 */
	PaymentApproval confirm(String paymentKey, String orderNumber, int amount);

	/**
	 * 결제 취소(전액 환불). 무통장입금으로 입금까지 끝난 결제는 refundAccount(고객 환불 계좌)가 있어야 한다.
	 * 입금 전 가상계좌는 refundAccount 없이 계좌를 닫는다.
	 */
	void cancel(String paymentKey, int amount, String reason, RefundAccount refundAccount);

	/**
	 * 승인 결과. virtualAccount 가 있으면 무통장입금 계좌만 발급된 것이고(입금 대기), 없으면 바로 결제완료다.
	 *
	 * @param method PG 가 알려 준 결제수단(예: 카드, 가상계좌)
	 * @param secret 입금 웹훅 검증 값(무통장입금일 때)
	 */
	record PaymentApproval(String paymentKey, int approvedAmount, String method, String secret,
		VirtualAccount virtualAccount) {

		public static PaymentApproval paid(String paymentKey, int approvedAmount, String method) {
			return new PaymentApproval(paymentKey, approvedAmount, method, null, null);
		}
	}

	/** 무통장입금 계좌. bankCode 는 토스 은행 코드(예: 88 신한). */
	record VirtualAccount(String bankCode, String accountNumber, String customerName, LocalDateTime dueAt) {
	}

	/** 무통장입금 환불 계좌. bank 는 토스 은행 코드. */
	record RefundAccount(String bank, String accountNumber, String holderName) {
	}

	class PaymentGatewayException extends RuntimeException {

		public PaymentGatewayException(String message) {
			super(message);
		}
	}
}
