package com.eatomato.backend.order;

import java.util.EnumSet;
import java.util.Set;

/**
 * 주문 상태와 허용 전이.
 *
 * PENDING_PAYMENT(결제대기) ─결제 승인→ PAID(결제완료) ─→ PREPARING(상품준비중) ─→ SHIPPING(배송중) ─→ DELIVERED(배송완료)
 *        └─무통장입금 발급→ AWAITING_DEPOSIT(입금대기) ─입금 확인→ PAID
 *        └──────────────┴──────────────┴──────────────┴─→ CANCELLED(취소)  (배송 시작 전까지만 취소)
 *
 * 결제완료·입금대기로는 결제 승인·입금 웹훅으로만 바뀐다. 관리자가 직접 바꿀 수는 없다.
 * 상품준비중부터는 고객이 직접 취소할 수 없고, 관리자 취소(품절 등)와 PG 취소 반영만 된다.
 */
public enum OrderStatus {

	PENDING_PAYMENT,
	/** 무통장입금(가상계좌) 계좌를 받고 입금을 기다리는 중. 재고는 계속 잡아 둔다. */
	AWAITING_DEPOSIT,
	PAID,
	/** 관리자가 상품 준비를 시작한 주문. 고객은 더 이상 직접 취소할 수 없다. */
	PREPARING,
	SHIPPING,
	DELIVERED,
	CANCELLED;

	/** 매출·판매량에 잡히는 상태(결제가 끝난 주문). */
	public static final Set<OrderStatus> PAID_STATES = EnumSet.of(PAID, PREPARING, SHIPPING, DELIVERED);

	/**
	 * 후기를 쓸 수 있는 상태. 후기 적립금을 주므로 더는 취소할 수 없는(배송이 시작된) 주문만 받는다.
	 * 결제완료(PAID)를 넣으면 후기 적립 → 주문 취소를 반복해 적립금을 쌓을 수 있다.
	 */
	public static final Set<OrderStatus> REVIEWABLE_STATES = EnumSet.of(SHIPPING, DELIVERED);

	public Set<OrderStatus> next() {
		return switch (this) {
			case PENDING_PAYMENT -> EnumSet.of(AWAITING_DEPOSIT, PAID, CANCELLED);
			case AWAITING_DEPOSIT -> EnumSet.of(PAID, CANCELLED);
			case PAID -> EnumSet.of(PREPARING, CANCELLED);
			case PREPARING -> EnumSet.of(SHIPPING, CANCELLED);
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

	/** 취소할 수 있는 상태(배송 시작 전). 관리자 취소·PG 취소 반영·자동 만료 기준이다. */
	public boolean isCancellable() {
		return this == PENDING_PAYMENT || this == AWAITING_DEPOSIT || this == PAID || this == PREPARING;
	}

	/** 고객이 직접 취소할 수 있는 상태. 상품준비중부터는 고객센터(관리자 취소)로만 취소한다. */
	public boolean isCancellableByCustomer() {
		return this == PENDING_PAYMENT || this == AWAITING_DEPOSIT || this == PAID;
	}

	public boolean isPaid() {
		return PAID_STATES.contains(this);
	}

	public boolean isReviewable() {
		return REVIEWABLE_STATES.contains(this);
	}
}
