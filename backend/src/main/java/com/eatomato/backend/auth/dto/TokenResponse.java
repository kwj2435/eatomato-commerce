package com.eatomato.backend.auth.dto;

import com.eatomato.backend.member.dto.MemberResponse;

public record TokenResponse(String accessToken, String tokenType, long expiresIn, MemberResponse member) {

	public static TokenResponse bearer(String accessToken, long expiresIn, MemberResponse member) {
		return new TokenResponse(accessToken, "Bearer", expiresIn, member);
	}
}
