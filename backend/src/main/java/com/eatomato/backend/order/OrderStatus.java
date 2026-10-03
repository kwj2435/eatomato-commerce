package com.eatomato.backend.order;

import java.util.EnumSet;
import java.util.Set;

/**
 * 주문 상태와 허용 전이.
 *
 * PENDING_PAYMENT(결제대기) ─결제 승인→ PAID(결제완료) ─→ SHIPPING(배송중) ─→ DELIVERED(배송완료)
 *        └─무통장입금 발급→ AWAITING_DEPOSIT(입금대기) ─입금 확인→ PAID
 *        └──────────────┴──────────────┴─→ CANCELLED(취소)  (배송 시작 전까지만 취소)
 *
 * 결제완료·입금대기로는 결제 승인·입금 웹훅으로만 바뀐다. 관리자가 직접 바꿀 수는 없다.
 */
public enum OrderStatus {

	PENDING_PAYMENT,
	/** 무통장입금(가상계좌) 계좌를 받고 입금을 기다리는 중. 재고는 계속 잡아 둔다. */
	AWAITING_DEPOSIT,
	PAID,
	SHIPPING,
	DELIVERED,
	CANCELLED;

	/** 매출·판매량·후기 작성에 잡히는 상태(결제가 끝난 주문). */
	public static final Set<OrderStatus> PAID_STATES = EnumSet.of(PAID, SHIPPING, DELIVERED);

	public Set<OrderStatus> next() {
		return switch (this) {
			case PENDING_PAYMENT -> EnumSet.of(AWAITING_DEPOSIT, PAID, CANCELLED);
			case AWAITING_DEPOSIT -> EnumSet.of(PAID, CANCELLED);
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
		next.remove(AWAITING_DEPOSIT);
		return next;
	}

	public boolean isCancellable() {
		return this == PENDING_PAYMENT || this == AWAITING_DEPOSIT || this == PAID;
	}

	public boolean isPaid() {
		return PAID_STATES.contains(this);
	}
}
