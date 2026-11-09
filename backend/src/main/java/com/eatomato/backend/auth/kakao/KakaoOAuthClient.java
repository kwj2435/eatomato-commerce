package com.eatomato.backend.auth.kakao;

import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import com.eatomato.backend.global.config.AppProperties;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;

import lombok.extern.slf4j.Slf4j;

/**
 * 카카오 로그인 REST API 호출.
 * https://developers.kakao.com/docs/ko/kakaologin/rest-api
 */
@Slf4j
@Component
public class KakaoOAuthClient {

	private static final String AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";
	private static final String TOKEN_URL = "https://kauth.kakao.com/oauth/token";
	private static final String USER_URL = "https://kapi.kakao.com/v2/user/me";
	/**
	 * 휴대전화번호·CI 를 필수로 받을 때 인가 요청에 넣는 동의항목. scope 를 넣으면 여기 적은 항목만 동의 화면에
	 * 나오므로 이메일도 함께 적는다. 이미 모두 동의한 사용자는 동의 화면 없이 바로 넘어간다.
	 */
	static final String REQUIRED_SCOPE = "account_email,phone_number,account_ci";
	private static final Pattern MOBILE = Pattern.compile("01\\d{8,9}");

	private final AppProperties.Kakao properties;
	private final RestClient restClient = RestClient.create();

	public KakaoOAuthClient(AppProperties properties) {
		this.properties = properties.kakao();
	}

	/** 카카오 인가(로그인·동의) 화면 주소. */
	public String authorizeUrl(String redirectUri, String state) {
		UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(AUTHORIZE_URL)
			.queryParam("client_id", properties.restApiKey())
			.queryParam("redirect_uri", redirectUri)
			.queryParam("response_type", "code")
			.queryParam("state", state);
		if (properties.requirePhoneAndCi()) {
			builder.queryParam("scope", REQUIRED_SCOPE);
		}
		return builder.encode().toUriString();
	}

	/** 인가 코드 → 액세스 토큰 → 사용자 정보. */
	@SuppressWarnings("unchecked")
	public KakaoUser fetchUser(String code, String redirectUri) {
		try {
			MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
			form.add("grant_type", "authorization_code");
			form.add("client_id", properties.restApiKey());
			form.add("redirect_uri", redirectUri);
			form.add("code", code);
			if (properties.clientSecret() != null && !properties.clientSecret().isBlank()) {
				form.add("client_secret", properties.clientSecret());
			}
			Map<String, Object> token = restClient.post()
				.uri(TOKEN_URL)
				.contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.body(form)
				.retrieve()
				.body(Map.class);
			String accessToken = token == null ? null : (String) token.get("access_token");
			if (accessToken == null) {
				throw new ApiException(ErrorCode.KAKAO_LOGIN_FAILED);
			}

			Map<String, Object> user = restClient.get()
				.uri(USER_URL)
				.header("Authorization", "Bearer " + accessToken)
				.retrieve()
				.body(Map.class);
			if (user == null || user.get("id") == null) {
				throw new ApiException(ErrorCode.KAKAO_LOGIN_FAILED);
			}
			Map<String, Object> account = (Map<String, Object>) user.getOrDefault("kakao_account", Map.of());
			String email = (String) account.get("email");
			boolean verified = Boolean.TRUE.equals(account.get("is_email_valid"))
				&& Boolean.TRUE.equals(account.get("is_email_verified"));
			String ci = (String) account.get("ci");
			return new KakaoUser(((Number) user.get("id")).longValue(), email, verified,
				phone((String) account.get("phone_number")), ci == null || ci.isBlank() ? null : ci);
		} catch (RestClientException e) {
			// 코드 재사용·만료, redirect_uri 불일치, 키 오류 등. 원인은 서버 로그에만 남긴다.
			log.warn("카카오 로그인 실패: {}", e.getMessage());
			throw new ApiException(ErrorCode.KAKAO_LOGIN_FAILED);
		}
	}

	/**
	 * 카카오 전화번호(국내는 "+82 10-1234-5678" 또는 "+82 010-1234-5678") → "010-1234-5678".
	 * 해외 번호나 휴대폰 번호가 아니면 null.
	 */
	static String phone(String kakaoPhone) {
		if (kakaoPhone == null || !kakaoPhone.trim().startsWith("+82")) {
			return null;
		}
		String digits = kakaoPhone.trim().substring(3).replaceAll("[^0-9]", "");
		if (!digits.startsWith("0")) {
			digits = "0" + digits;
		}
		if (!MOBILE.matcher(digits).matches()) {
			return null;
		}
		return digits.substring(0, 3) + "-" + digits.substring(3, digits.length() - 4) + "-" + digits.substring(digits.length() - 4);
	}
}
