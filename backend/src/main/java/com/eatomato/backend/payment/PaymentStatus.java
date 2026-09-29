package com.eatomato.backend.payment;

public enum PaymentStatus {
	/** 주문 생성 직후, 결제 승인 전 */
	READY,
	/** 결제 승인 완료 */
	DONE,
	/** 결제 취소(환불) */
	CANCELED,
	/** 승인 실패 */
	FAILED
}
