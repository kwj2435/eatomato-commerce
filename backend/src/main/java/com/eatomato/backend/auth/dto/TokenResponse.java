package com.eatomato.backend.auth.dto;

import com.eatomato.backend.member.dto.MemberResponse;

/**
 * 로그인·가입·토큰 갱신 응답.
 *
 * @param expiresIn        액세스 토큰 유효 시간(초)
 * @param refreshToken     액세스 토큰이 만료되면 /api/auth/refresh 로 새 토큰을 받는 데 쓴다. 한 번 쓰면 바뀐다.
 * @param refreshExpiresIn 리프레시 토큰 유효 시간(초)
 */
public record TokenResponse(
	String accessToken,
	String tokenType,
	long expiresIn,
	String refreshToken,
	long refreshExpiresIn,
	MemberResponse member
) {
}
