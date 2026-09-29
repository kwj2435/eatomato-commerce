package com.eatomato.backend.payment;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.global.config.AppProperties;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.global.security.CurrentMemberId;
import com.eatomato.backend.order.Order;
import com.eatomato.backend.order.OrderRepository;
import com.eatomato.backend.order.OrderService;
import com.eatomato.backend.order.dto.OrderResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

	private final PaymentService paymentService;
	private final OrderService orderService;
	private final OrderRepository orderRepository;
	private final AppProperties properties;
	private final PaymentGateway paymentGateway;

	/** 주문서가 어떤 결제창을 띄울지. provider=TOSS 면 결제위젯 클라이언트 키(공개 키)를 함께 준다. */
	@GetMapping("/config")
	public PaymentConfig config() {
		String clientKey = "TOSS".equals(paymentGateway.provider()) ? properties.payment().tossClientKey() : null;
		return new PaymentConfig(paymentGateway.provider(), clientKey);
	}

	/** 결제 승인. PG 결제창이 successUrl 로 넘겨준 값을 그대로 보낸다. */
	@PostMapping("/confirm")
	public OrderResponse confirm(@CurrentMemberId Long memberId, @Valid @RequestBody ConfirmRequest request) {
		return paymentService.confirm(memberId, request.orderNumber(), request.paymentKey(), request.amount());
	}

	/**
	 * PG 서버가 결제 결과를 알려 주는 웹훅(가상계좌 입금, PG 쪽 취소 등).
	 * 로그인 대신 공유 비밀(X-Payment-Webhook-Secret)로 확인한다. 비밀이 설정되지 않으면 받지 않는다.
	 * 실제 PG 를 붙이면 그 PG 의 서명 검증 방식으로 바꾼다.
	 */
	@PostMapping("/webhook")
	public OrderResponse webhook(@RequestHeader(name = "X-Payment-Webhook-Secret", required = false) String secret,
		@Valid @RequestBody WebhookRequest request) {
		requireWebhookSecret(secret);
		if ("DONE".equals(request.status())) {
			return paymentService.confirm(null, request.orderNumber(), request.paymentKey(), request.amount());
		}
		Order order = orderRepository.findByOrderNumber(request.orderNumber())
			.orElseThrow(() -> new ApiException(ErrorCode.ORDER_NOT_FOUND));
		orderService.cancel(order, null, "PG 취소 알림");
		return OrderResponse.from(order);
	}

	private void requireWebhookSecret(String secret) {
		String expected = properties.payment() == null ? null : properties.payment().webhookSecret();
		if (expected == null || expected.isBlank() || secret == null
			|| !MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), secret.getBytes(StandardCharsets.UTF_8))) {
			throw new ApiException(ErrorCode.INVALID_WEBHOOK);
		}
	}

	public record PaymentConfig(String provider, String clientKey) {
	}

	public record ConfirmRequest(
		@NotBlank @Size(max = 30) String orderNumber,
		@NotBlank @Size(max = 200) String paymentKey,
		@Min(0) int amount) {
	}

	public record WebhookRequest(
		@NotBlank @Size(max = 30) String orderNumber,
		@NotBlank @Size(max = 200) String paymentKey,
		@NotBlank @Pattern(regexp = "DONE|CANCELED") String status,
		@Min(0) int amount) {
	}
}
