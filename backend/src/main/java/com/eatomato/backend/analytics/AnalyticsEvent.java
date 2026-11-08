package com.eatomato.backend.analytics;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 구매 단계 이벤트 한 건(담기·결제 시도·결제 완료). 페이지 조회(PageView)와 같은 방문자·방문 ID 로 묶는다.
 * IP·회원 정보는 남기지 않는다.
 */
@Entity
@Table(name = "analytics_event")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnalyticsEvent {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String visitorId;

	private String sessionId;

	private String eventType;

	private Long productId;

	private String orderNumber;

	private Integer amount;

	private LocalDateTime occurredAt;

	AnalyticsEvent(String visitorId, String sessionId, Type type, Long productId, String orderNumber, Integer amount,
		LocalDateTime occurredAt) {
		this.visitorId = visitorId;
		this.sessionId = sessionId;
		this.eventType = type.name();
		this.productId = productId;
		this.orderNumber = orderNumber;
		this.amount = amount;
		this.occurredAt = occurredAt;
	}

	public enum Type {
		/** 장바구니 담기. productId·수량. */
		ADD_TO_CART,
		/** 주문서에서 결제하기를 눌러 주문이 만들어짐. 주문 금액. */
		CHECKOUT_START,
		/** 결제 완료(서버가 결제된 주문인지 확인한 것만). 주문 금액. */
		PURCHASE
	}
}
