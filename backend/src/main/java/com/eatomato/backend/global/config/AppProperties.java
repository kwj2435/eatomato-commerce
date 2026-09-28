package com.eatomato.backend.global.config;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Upload upload, Seed seed, Admin admin, Kakao kakao) {

	public record Jwt(String secret, Duration accessTokenTtl) {
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

	/** 기동 시 관리자 계정을 보장한다. loginId·password 가 비어 있으면 아무것도 하지 않는다. */
	public record Admin(String loginId, String password, String email) {
	}
}
