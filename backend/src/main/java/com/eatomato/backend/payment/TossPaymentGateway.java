package com.eatomato.backend.payment;

import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import com.eatomato.backend.global.config.AppProperties;
import com.eatomato.backend.global.time.Times;

import lombok.extern.slf4j.Slf4j;

/**
 * 토스페이먼츠 결제위젯 연동. 시크릿 키(결제위젯 연동 키 test_gsk_/live_gsk_)로 승인·취소·조회 API 를 부른다.
 * https://docs.tosspayments.com/reference
 *
 * 예외 메시지는 고객에게 그대로 보여 준다(토스가 주는 message 가 "카드 한도 초과" 같은 안내 문구다).
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.payment", name = "provider", havingValue = "toss")
public class TossPaymentGateway implements PaymentGateway {

	private static final String BASE_URL = "https://api.tosspayments.com/v1/payments";

	private final RestClient restClient;

	public TossPaymentGateway(AppProperties properties) {
		AppProperties.Payment payment = properties.payment();
		if (payment == null || isBlank(payment.tossSecretKey()) || isBlank(payment.tossClientKey())) {
			throw new IllegalStateException("PAYMENT_PROVIDER=toss 이면 TOSS_CLIENT_KEY·TOSS_SECRET_KEY 가 필요합니다.");
		}
		String basic = Base64.getEncoder()
			.encodeToString((payment.tossSecretKey() + ":").getBytes(StandardCharsets.UTF_8));
		// 승인은 카드사까지 다녀와 오래 걸릴 수 있어 읽기 제한을 넉넉히 둔다(토스 권장 60초).
		JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
			HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
		factory.setReadTimeout(Duration.ofSeconds(60));
		this.restClient = RestClient.builder()
			.baseUrl(BASE_URL)
			.requestFactory(factory)
			.defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + basic)
			.build();
	}

	@Override
	public String provider() {
		return "TOSS";
	}

	@Override
	public PaymentApproval confirm(String paymentKey, String orderNumber, int amount) {
		TossPayment payment;
		try {
			payment = restClient.post()
				.uri("/confirm")
				.contentType(MediaType.APPLICATION_JSON)
				.body(Map.of("paymentKey", paymentKey, "orderId", orderNumber, "amount", amount))
				.retrieve()
				.body(TossPayment.class);
		} catch (RestClientResponseException e) {
			TossError error = error(e);
			// 앞선 승인 요청이 토스에서는 성공했는데 응답을 못 받은 경우(타임아웃 뒤 재시도). 조회로 결과를 확인한다.
			if (!"ALREADY_PROCESSED_PAYMENT".equals(error.code())) {
				log.warn("토스 승인 거절: 주문 {} [{}] {}", orderNumber, error.code(), error.message());
				throw new PaymentGatewayException(error.message());
			}
			payment = find(paymentKey);
		} catch (RestClientException e) {
			log.warn("토스 승인 통신 실패: 주문 {} ({})", orderNumber, e.getMessage());
			throw new PaymentGatewayException("결제 승인 중 통신 오류가 발생했습니다. 잠시 뒤 다시 시도해 주세요.");
		}

		if (payment == null || !orderNumber.equals(payment.orderId())) {
			throw new PaymentGatewayException("결제 정보가 주문과 맞지 않습니다.");
		}
		if ("DONE".equals(payment.status())) {
			return PaymentApproval.paid(payment.paymentKey(), payment.totalAmount(), payment.method());
		}
		// 무통장입금(가상계좌)은 승인하면 계좌만 발급되고 입금 대기다. 입금은 DEPOSIT_CALLBACK 웹훅으로 온다.
		if ("WAITING_FOR_DEPOSIT".equals(payment.status()) && payment.virtualAccount() != null) {
			TossVirtualAccount va = payment.virtualAccount();
			return new PaymentApproval(payment.paymentKey(), payment.totalAmount(), payment.method(), payment.secret(),
				new VirtualAccount(va.bankCode(), va.accountNumber(), va.customerName(), toKst(va.dueDate())));
		}
		log.warn("토스 승인 결과를 처리할 수 없음: 주문 {} ({})", orderNumber, payment.status());
		throw new PaymentGatewayException("지원하지 않는 결제 수단입니다. 다른 결제 수단을 선택해 주세요.");
	}

	@Override
	public void cancel(String paymentKey, int amount, String reason, RefundAccount refundAccount) {
		String cancelReason = isBlank(reason) ? "주문 취소" : reason.substring(0, Math.min(reason.length(), 200));
		Map<String, Object> body = new HashMap<>();
		body.put("cancelReason", cancelReason);
		if (refundAccount != null) {
			body.put("refundReceiveAccount", Map.of("bank", refundAccount.bank(),
				"accountNumber", refundAccount.accountNumber(), "holderName", refundAccount.holderName()));
		}
		try {
			restClient.post()
				.uri("/{paymentKey}/cancel", paymentKey)
				// 전액 취소만 하므로 결제당 키 하나: 재시도해도 두 번 환불되지 않는다.
				.header("Idempotency-Key", "cancel-" + paymentKey)
				.contentType(MediaType.APPLICATION_JSON)
				.body(body)
				.retrieve()
				.toBodilessEntity();
		} catch (RestClientResponseException e) {
			TossError error = error(e);
			if ("ALREADY_CANCELED_PAYMENT".equals(error.code())) {
				return;
			}
			log.warn("토스 취소 실패: {} [{}] {}", paymentKey, error.code(), error.message());
			throw new PaymentGatewayException(error.message());
		} catch (RestClientException e) {
			log.warn("토스 취소 통신 실패: {} ({})", paymentKey, e.getMessage());
			throw new PaymentGatewayException("결제 취소 중 통신 오류가 발생했습니다.");
		}
	}

	/** 결제 조회. 웹훅 본문은 서명이 없어 믿지 않고, 이 조회 결과로 판단한다. */
	public TossPayment find(String paymentKey) {
		try {
			return restClient.get().uri("/{paymentKey}", paymentKey).retrieve().body(TossPayment.class);
		} catch (RestClientResponseException e) {
			TossError error = error(e);
			throw new PaymentGatewayException(error.message());
		} catch (RestClientException e) {
			throw new PaymentGatewayException("결제 조회 중 통신 오류가 발생했습니다.");
		}
	}

	private static TossError error(RestClientResponseException e) {
		try {
			TossError error = e.getResponseBodyAs(TossError.class);
			if (error != null && error.message() != null) {
				return error;
			}
		} catch (RuntimeException ignored) {
			// 본문이 JSON 이 아니면 아래 기본 문구
		}
		return new TossError("HTTP_" + e.getStatusCode().value(), "결제 처리 중 오류가 발생했습니다.");
	}

	/** 토스 일시(2026-10-10T23:59:59+09:00)를 서버 기준(KST) LocalDateTime 으로. */
	private static LocalDateTime toKst(String dateTime) {
		return dateTime == null ? null
			: OffsetDateTime.parse(dateTime).atZoneSameInstant(Times.KST).toLocalDateTime();
	}

	private static boolean isBlank(String value) {
		return value == null || value.isBlank();
	}

	/**
	 * 토스 Payment 객체 중 쓰는 필드만. status: READY, IN_PROGRESS, WAITING_FOR_DEPOSIT, DONE, CANCELED, ...
	 * method 는 한글 이름(카드, 가상계좌, 간편결제 등)이다.
	 */
	@JsonIgnoreProperties(ignoreUnknown = true)
	public record TossPayment(String paymentKey, String orderId, String status, int totalAmount, String method,
		String secret, TossVirtualAccount virtualAccount) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record TossVirtualAccount(String accountNumber, String bankCode, String customerName, String dueDate) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record TossError(String code, String message) {
	}
}
