package com.eatomato.backend.global.config;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Upload upload, Seed seed) {

	public record Jwt(String secret, Duration accessTokenTtl) {
	}

	public record Cors(List<String> allowedOrigins) {
	}

	public record Upload(String dir, String publicBaseUrl) {
	}

	public record Seed(boolean enabled) {
	}
}
