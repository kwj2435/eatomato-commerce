package com.eatomato.backend.notification;

import java.util.List;
import java.util.Optional;

import com.eatomato.backend.notification.AlimtalkSender.Button;
import com.eatomato.backend.order.OrderStatus;

/**
 * 알림톡 종류(주문 단계별, 받는 분 연락처로 보냄). 카카오 검수를 받은 템플릿 ID 는 설정(app.alimtalk.templates)에서
 * 종류별로 넣는다. 템플릿 본문의 변수(#{...})는 AlimtalkService 가 채우는 이름과 같아야 한다(backend/README.md 알림톡 참고).
 */
public enum AlimtalkTemplate {

	/**
	 * 결제 완료(카드 승인·무통장 입금 확인·전액 할인). 변수: #{고객명} #{주문번호} #{상품명} #{결제금액}
	 * 버튼: 주문 내역 보기(회원), 비회원 주문 조회
	 */
	ORDER_PAID(
		Button.webLink("주문 내역 보기", "https://eatomato.kr/mypage"),
		Button.webLink("비회원 주문 조회", "https://eatomato.kr/orders/guest")),
	/** 상품준비중. 변수: #{고객명} #{주문번호} #{상품명}. 버튼 없음 */
	ORDER_PREPARING,
	/** 배송 시작. 변수: #{고객명} #{주문번호} #{택배사} #{송장번호}. 버튼: 배송 조회(카카오 배송조회) */
	ORDER_SHIPPING(
		Button.deliveryTracking("배송 조회")),
	/** 결제된 주문의 취소·환불. 변수: #{고객명} #{주문번호} #{상품명} #{환불금액}. 버튼: 주문 내역 보기 */
	ORDER_CANCELLED(
		Button.webLink("주문 내역 보기", "https://eatomato.kr/mypage"));

	/**
	 * 카카오 검수를 받은 템플릿의 버튼. 이름·순서·링크가 검수본과 같아야 해서 설정이 아니라 여기 고정한다
	 * (템플릿 버튼을 바꾸면 재검수 후 여기도 같이 바꾼다).
	 */
	private final List<Button> buttons;

	AlimtalkTemplate(Button... buttons) {
		this.buttons = List.of(buttons);
	}

	public List<Button> buttons() {
		return buttons;
	}

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
