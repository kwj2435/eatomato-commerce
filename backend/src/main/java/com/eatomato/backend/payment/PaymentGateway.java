package com.eatomato.backend.payment;

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

	/** 결제 취소(전액 환불). */
	void cancel(String paymentKey, int amount, String reason);

	record PaymentApproval(String paymentKey, int approvedAmount) {
	}

	class PaymentGatewayException extends RuntimeException {

		public PaymentGatewayException(String message) {
			super(message);
		}
	}
}
