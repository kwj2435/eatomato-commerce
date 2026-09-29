package com.eatomato.backend.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** 가입 후 추가 정보: 닉네임과 기본 배송지 주소. */
public record ProfileRequest(
	@NotBlank @Pattern(regexp = NICKNAME_PATTERN, message = NICKNAME_MESSAGE) String nickname,
	@NotBlank @Pattern(regexp = "\\d{5}", message = "우편번호는 5자리입니다.") String zipCode,
	@NotBlank @Size(max = 200) String roadAddress,
	@Size(max = 200) String detailAddress
) {

	public static final String NICKNAME_PATTERN = "[가-힣a-zA-Z0-9_]{2,12}";
	public static final String NICKNAME_MESSAGE = "닉네임은 한글·영문·숫자·밑줄(_) 2~12자입니다.";
}
