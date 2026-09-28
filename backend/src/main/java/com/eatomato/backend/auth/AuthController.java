package com.eatomato.backend.auth;

import java.net.URI;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.auth.dto.LoginRequest;
import com.eatomato.backend.auth.dto.RefreshRequest;
import com.eatomato.backend.auth.dto.SignupRequest;
import com.eatomato.backend.auth.dto.TokenResponse;
import com.eatomato.backend.auth.kakao.KakaoLoginRequest;
import com.eatomato.backend.auth.kakao.KakaoOAuthClient;
import com.eatomato.backend.global.config.AppProperties;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;
	private final KakaoOAuthClient kakaoOAuthClient;
	private final AppProperties properties;

	/** 가입과 동시에 로그인 토큰을 내려준다. */
	@PostMapping("/signup")
	@ResponseStatus(HttpStatus.CREATED)
	public TokenResponse signup(@Valid @RequestBody SignupRequest request) {
		return authService.signup(request);
	}

	@PostMapping("/login")
	public TokenResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}

	/** 액세스 토큰 갱신. 리프레시 토큰도 새로 바뀐다. */
	@PostMapping("/refresh")
	public TokenResponse refresh(@Valid @RequestBody RefreshRequest request) {
		return authService.refresh(request.refreshToken());
	}

	/** 로그아웃: 리프레시 토큰 폐기. 토큰이 없거나 이미 폐기됐어도 204. */
	@PostMapping("/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void logout(@Valid @RequestBody RefreshRequest request) {
		authService.logout(request.refreshToken());
	}

	/**
	 * 카카오 로그인 시작. 브라우저를 카카오 인가 화면으로 보낸다(302).
	 * REST API 키를 프론트 번들에 넣지 않으려고 서버가 주소를 만든다.
	 *
	 * @param state 프론트가 만든 난수. 콜백에서 같은 값인지 확인해 CSRF 를 막는다.
	 */
	@GetMapping("/kakao/authorize")
	public ResponseEntity<Void> kakaoAuthorize(
		@RequestParam String redirectUri,
		@RequestParam @NotBlank @Size(max = 100) String state) {
		requireKakaoRedirect(redirectUri);
		return ResponseEntity.status(HttpStatus.FOUND)
			.location(URI.create(kakaoOAuthClient.authorizeUrl(redirectUri, state)))
			.build();
	}

	/** 카카오 인가 코드로 로그인(없으면 가입). */
	@PostMapping("/kakao")
	public TokenResponse kakaoLogin(@Valid @RequestBody KakaoLoginRequest request) {
		requireKakaoRedirect(request.redirectUri());
		return authService.loginWithKakao(kakaoOAuthClient.fetchUser(request.code(), request.redirectUri()));
	}

	private void requireKakaoRedirect(String redirectUri) {
		AppProperties.Kakao kakao = properties.kakao();
		if (kakao == null || !kakao.configured()) {
			throw new ApiException(ErrorCode.KAKAO_NOT_CONFIGURED);
		}
		if (kakao.redirectUris() == null || !kakao.redirectUris().contains(redirectUri)) {
			throw new ApiException(ErrorCode.KAKAO_INVALID_REDIRECT);
		}
	}
}
