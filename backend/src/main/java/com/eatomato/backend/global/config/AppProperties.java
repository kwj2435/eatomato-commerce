package com.eatomato.backend.global.config;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Upload upload, Seed seed, Admin admin, Kakao kakao, Payment payment,
	LoginLimit loginLimit) {

	public record Jwt(String secret, Duration accessTokenTtl, Duration refreshTokenTtl) {
	}

	public record Cors(List<String> allowedOrigins) {
	}

	public record Upload(String dir, String publicBaseUrl) {
	}

	public record Seed(boolean enabled) {
	}

	/**
	 * 카카오 로그인(REST API). redirectUris 는 카카오 콘솔에 등록한 주소와 글자 하나까지 같아야 한다.
	 * 프론트가 보낸 redirectUri 가 이 목록에 없으면 거절한다(임의 주소로 인가 코드가 새지 않도록).
	 */
	public record Kakao(String restApiKey, String clientSecret, List<String> redirectUris) {

		public boolean configured() {
			return restApiKey != null && !restApiKey.isBlank();
		}
	}

	/**
	 * 결제. provider=mock 이면 결제가 항상 성공했다고 본다, toss 면 토스페이먼츠 결제위젯을 쓴다.
	 * webhookSecret 이 비어 있으면 공유 비밀 웹훅(/api/payments/webhook)을 받지 않는다.
	 * tossClientKey 는 브라우저에 내려가는 공개 키(test_gck_/live_gck_), tossSecretKey 는 서버 전용(test_gsk_/live_gsk_).
	 */
	public record Payment(String provider, String webhookSecret, String tossClientKey, String tossSecretKey) {
	}

	/** 로그인 시도 제한. window 안에 계정별 maxPerAccount 회, IP별 maxPerIp 회 실패하면 잠근다. */
	public record LoginLimit(int maxPerAccount, int maxPerIp, Duration window) {
	}

	/** 기동 시 관리자 계정을 보장한다. loginId·password 가 비어 있으면 아무것도 하지 않는다. */
	public record Admin(String loginId, String password, String email) {
	}
}
