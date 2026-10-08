package com.eatomato.backend.point;

/** 적립금 내역 종류. */
public enum PointType {
	/** 배송완료 구매 적립 */
	ORDER_EARN,
	/** 후기 작성 적립 */
	REVIEW_EARN,
	/** 주문에 사용 */
	ORDER_USE,
	/** 주문 취소로 사용분 반환 */
	ORDER_REFUND
}
