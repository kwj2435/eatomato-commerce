package com.eatomato.backend.order;

import java.util.EnumSet;
import java.util.Set;

/**
 * 주문 상태와 허용 전이.
 *
 * PENDING_PAYMENT(결제대기) ─결제 승인→ PAID(결제완료) ─→ SHIPPING(배송중) ─→ DELIVERED(배송완료)
 *        └──────────────┴─→ CANCELLED(취소)  (배송 시작 전까지만 취소)
 *
 * 결제완료로는 결제 승인(PG 콜백)으로만 바뀐다. 관리자가 직접 결제완료로 바꿀 수는 없다.
 */
public enum OrderStatus {

	PENDING_PAYMENT,
	PAID,
	SHIPPING,
	DELIVERED,
	CANCELLED;

	/** 매출·판매량·후기 작성에 잡히는 상태(결제가 끝난 주문). */
	public static final Set<OrderStatus> PAID_STATES = EnumSet.of(PAID, SHIPPING, DELIVERED);

	public Set<OrderStatus> next() {
		return switch (this) {
			case PENDING_PAYMENT -> EnumSet.of(PAID, CANCELLED);
			case PAID -> EnumSet.of(SHIPPING, CANCELLED);
			case SHIPPING -> EnumSet.of(DELIVERED);
			case DELIVERED, CANCELLED -> EnumSet.noneOf(OrderStatus.class);
		};
	}

	/** 관리자가 화면에서 고를 수 있는 다음 상태(결제완료는 결제 승인으로만). */
	public Set<OrderStatus> nextByAdmin() {
		Set<OrderStatus> next = EnumSet.noneOf(OrderStatus.class);
		next.addAll(next());
		next.remove(PAID);
		return next;
	}

	public boolean isCancellable() {
		return this == PENDING_PAYMENT || this == PAID;
	}

	public boolean isPaid() {
		return PAID_STATES.contains(this);
	}
}
