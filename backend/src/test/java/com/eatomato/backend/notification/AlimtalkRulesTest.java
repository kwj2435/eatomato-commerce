package com.eatomato.backend.notification;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.eatomato.backend.order.OrderStatus;

/** 알림톡 규칙(스프링 없이). */
class AlimtalkRulesTest {

	@Test
	void 상태_변경별_알림_종류() {
		assertThat(AlimtalkTemplate.forOrder(OrderStatus.PENDING_PAYMENT, OrderStatus.PAID)).contains(AlimtalkTemplate.ORDER_PAID);
		assertThat(AlimtalkTemplate.forOrder(OrderStatus.AWAITING_DEPOSIT, OrderStatus.PAID)).contains(AlimtalkTemplate.ORDER_PAID);
		assertThat(AlimtalkTemplate.forOrder(OrderStatus.PAID, OrderStatus.PREPARING)).contains(AlimtalkTemplate.ORDER_PREPARING);
		assertThat(AlimtalkTemplate.forOrder(OrderStatus.PREPARING, OrderStatus.SHIPPING)).contains(AlimtalkTemplate.ORDER_SHIPPING);
		assertThat(AlimtalkTemplate.forOrder(OrderStatus.PAID, OrderStatus.CANCELLED)).contains(AlimtalkTemplate.ORDER_CANCELLED);
		assertThat(AlimtalkTemplate.forOrder(OrderStatus.PREPARING, OrderStatus.CANCELLED)).contains(AlimtalkTemplate.ORDER_CANCELLED);
		// 결제 전 취소·주문서 제출·입금대기·배송완료는 보내지 않는다
		assertThat(AlimtalkTemplate.forOrder(OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED)).isEmpty();
		assertThat(AlimtalkTemplate.forOrder(OrderStatus.AWAITING_DEPOSIT, OrderStatus.CANCELLED)).isEmpty();
		assertThat(AlimtalkTemplate.forOrder(null, OrderStatus.PENDING_PAYMENT)).isEmpty();
		assertThat(AlimtalkTemplate.forOrder(OrderStatus.PENDING_PAYMENT, OrderStatus.AWAITING_DEPOSIT)).isEmpty();
		assertThat(AlimtalkTemplate.forOrder(OrderStatus.SHIPPING, OrderStatus.DELIVERED)).isEmpty();
	}

	@Test
	void 휴대폰_번호만_받는다() {
		assertThat(AlimtalkService.normalize("010-1234-5678")).isEqualTo("01012345678");
		assertThat(AlimtalkService.normalize("011 234 5678")).isEqualTo("0112345678");
		assertThat(AlimtalkService.normalize("02-123-4567")).isNull();
		assertThat(AlimtalkService.normalize("")).isNull();
		assertThat(AlimtalkService.normalize(null)).isNull();
		assertThat(NotificationLog.mask("01012345678")).isEqualTo("010-****-5678");
	}

	@Test
	void 솔라피_서명은_HMAC_SHA256_16진수() {
		// 알려진 값: HMAC_SHA256("key", "The quick brown fox jumps over the lazy dog")
		assertThat(SolapiAlimtalkSender.sign("key", "The quick brown fox jumps over the lazy dog"))
			.isEqualTo("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8");
	}
}
