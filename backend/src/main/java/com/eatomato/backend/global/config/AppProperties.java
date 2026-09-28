package com.eatomato.backend.global.config;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Upload upload, Seed seed, Admin admin) {

	public record Jwt(String secret, Duration accessTokenTtl) {
	}

	public record Cors(List<String> allowedOrigins) {
	}

	public record Upload(String dir, String publicBaseUrl) {
	}

	public record Seed(boolean enabled) {
	}

	/** 기동 시 관리자 계정을 보장한다. loginId·password 가 비어 있으면 아무것도 하지 않는다. */
	public record Admin(String loginId, String password, String email) {
	}
}
