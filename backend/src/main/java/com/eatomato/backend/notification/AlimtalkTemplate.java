package com.eatomato.backend.notification;

import java.util.Optional;

import com.eatomato.backend.order.OrderStatus;

/**
 * 알림톡 종류(주문 단계별, 받는 분 연락처로 보냄). 카카오 검수를 받은 템플릿 ID 는 설정(app.alimtalk.templates)에서
 * 종류별로 넣는다. 템플릿 본문의 변수(#{...})는 AlimtalkService 가 채우는 이름과 같아야 한다(backend/README.md 알림톡 참고).
 */
public enum AlimtalkTemplate {

	/** 결제 완료(카드 승인·무통장 입금 확인·전액 할인). 변수: #{고객명} #{주문번호} #{상품명} #{결제금액} */
	ORDER_PAID,
	/** 상품준비중. 변수: #{고객명} #{주문번호} #{상품명} */
	ORDER_PREPARING,
	/** 배송 시작. 변수: #{고객명} #{주문번호} #{택배사} #{송장번호} */
	ORDER_SHIPPING,
	/** 결제된 주문의 취소·환불. 변수: #{고객명} #{주문번호} #{상품명} #{환불금액} */
	ORDER_CANCELLED;

	/**
	 * 주문 상태 변경에 맞는 알림. 결제 전 주문(결제대기·입금대기)의 취소는 돌려줄 돈이 없어 보내지 않는다
	 * (결제창을 닫아 생긴 미결제 주문 취소 등).
	 */
	public static Optional<AlimtalkTemplate> forOrder(OrderStatus from, OrderStatus to) {
		AlimtalkTemplate template = switch (to) {
			case PAID -> ORDER_PAID;
			case PREPARING -> ORDER_PREPARING;
			case SHIPPING -> ORDER_SHIPPING;
			case CANCELLED -> from != null && from.isPaid() ? ORDER_CANCELLED : null;
			default -> null;
		};
		return Optional.ofNullable(template);
	}
}
