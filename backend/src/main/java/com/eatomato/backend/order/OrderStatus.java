package com.eatomato.backend.order;

public enum OrderStatus {
	/** 결제 완료. PG 연동 전까지는 주문 생성 즉시 이 상태가 된다. */
	PAID,
	CANCELLED
}
