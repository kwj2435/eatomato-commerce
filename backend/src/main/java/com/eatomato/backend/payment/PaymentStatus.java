package com.eatomato.backend.payment;

public enum PaymentStatus {
	/** 주문 생성 직후, 결제 승인 전 */
	READY,
	/** 무통장입금 계좌 발급, 입금 대기 */
	WAITING_FOR_DEPOSIT,
	/** 결제 승인 완료 */
	DONE,
	/** 결제 취소(환불) */
	CANCELED,
	/** 승인 실패 */
	FAILED
}
