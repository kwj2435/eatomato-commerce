package com.eatomato.backend.auth.naver;

import java.util.Map;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import com.eatomato.backend.global.config.AppProperties;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;

import lombok.extern.slf4j.Slf4j;

/**
 * 네이버 로그인 API 호출.
 * https://developers.naver.com/docs/login/devguide/devguide.md
 */
@Slf4j
@Component
public class NaverOAuthClient {

	private static final String AUTHORIZE_URL = "https://nid.naver.com/oauth2.0/authorize";
	private static final String TOKEN_URL = "https://nid.naver.com/oauth2.0/token";
	private static final String PROFILE_URL = "https://openapi.naver.com/v1/nid/me";

	private final AppProperties.Naver properties;
	private final RestClient restClient = RestClient.create();

	public NaverOAuthClient(AppProperties properties) {
		this.properties = properties.naver();
	}

	/** 네이버 로그인·동의 화면 주소. */
	public String authorizeUrl(String redirectUri, String state) {
		return UriComponentsBuilder.fromUriString(AUTHORIZE_URL)
			.queryParam("response_type", "code")
			.queryParam("client_id", properties.clientId())
			.queryParam("redirect_uri", redirectUri)
			.queryParam("state", state)
			.encode()
			.toUriString();
	}

	/** 인가 코드 → 액세스 토큰 → 회원 프로필. */
	@SuppressWarnings("unchecked")
	public NaverUser fetchUser(String code, String state) {
		try {
			String tokenUri = UriComponentsBuilder.fromUriString(TOKEN_URL)
				.queryParam("grant_type", "authorization_code")
				.queryParam("client_id", properties.clientId())
				.queryParam("client_secret", properties.clientSecret())
				.queryParam("code", code)
				.queryParam("state", state)
				.encode()
				.toUriString();
			Map<String, Object> token = restClient.post().uri(tokenUri).retrieve().body(Map.class);
			// 네이버는 실패해도 200 에 error 필드로 알려준다
			String accessToken = token == null ? null : (String) token.get("access_token");
			if (accessToken == null) {
				log.warn("네이버 토큰 발급 실패: {}", token == null ? null : token.get("error_description"));
				throw new ApiException(ErrorCode.NAVER_LOGIN_FAILED);
			}

			Map<String, Object> body = restClient.get()
				.uri(PROFILE_URL)
				.header("Authorization", "Bearer " + accessToken)
				.retrieve()
				.body(Map.class);
			Map<String, Object> profile = body == null ? null : (Map<String, Object>) body.get("response");
			if (profile == null || profile.get("id") == null) {
				throw new ApiException(ErrorCode.NAVER_LOGIN_FAILED);
			}
			// 동의 항목(배송지 등)이 어떤 필드로 오는지 확인하려고 필드 이름만 남긴다. 값은 개인정보라 남기지 않는다.
			log.info("네이버 프로필 필드: {}", profile.keySet());
			return new NaverUser(
				(String) profile.get("id"),
				(String) profile.get("email"),
				(String) profile.get("name"),
				(String) profile.get("mobile"));
		} catch (RestClientException e) {
			// 코드 재사용·만료, 키 오류 등. 원인은 서버 로그에만 남긴다.
			log.warn("네이버 로그인 실패: {}", e.getMessage());
			throw new ApiException(ErrorCode.NAVER_LOGIN_FAILED);
		}
	}
}
