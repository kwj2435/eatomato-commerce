package com.eatomato.backend.payment;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 토스페이먼츠 웹훅(개발자센터 > 웹훅에 https://eatomato.kr/api/payments/toss/webhook, 이벤트 PAYMENT_STATUS_CHANGED 등록).
 * 상점관리자에서 직접 취소한 결제를 주문에 반영한다.
 *
 * 토스 웹훅에는 서명이 없어 본문은 paymentKey 만 쓰고, 상태는 시크릿 키로 결제를 다시 조회해 확인한다.
 * 200 이 아니면 토스가 재전송하므로 처리할 것이 없거나 실패해도 200 을 돌려주고 로그만 남긴다.
 */
@Slf4j
@RestController
@RequestMapping("/api/payments/toss")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.payment", name = "provider", havingValue = "toss")
public class TossWebhookController {

	private final TossPaymentGateway tossPaymentGateway;
	private final PaymentService paymentService;

	@PostMapping("/webhook")
	public ResponseEntity<Void> webhook(@RequestBody TossWebhook webhook) {
		if (!"PAYMENT_STATUS_CHANGED".equals(webhook.eventType()) || webhook.data() == null
			|| webhook.data().paymentKey() == null) {
			return ResponseEntity.ok().build();
		}
		try {
			TossPaymentGateway.TossPayment payment = tossPaymentGateway.find(webhook.data().paymentKey());
			if ("CANCELED".equals(payment.status())) {
				paymentService.cancelByGateway(payment.orderId(), payment.paymentKey());
			}
		} catch (RuntimeException e) {
			log.warn("토스 웹훅 처리 실패: {} ({})", webhook.data().paymentKey(), e.getMessage());
		}
		return ResponseEntity.ok().build();
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record TossWebhook(String eventType, Data data) {

		@JsonIgnoreProperties(ignoreUnknown = true)
		public record Data(String paymentKey) {
		}
	}
}
