package com.eatomato.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 이메일 회원가입. 로그인은 이메일로 한다.
 *
 * @param loginId 비우면 서버가 이메일 앞부분으로 만든다(회원 정보의 "아이디"로 보인다).
 */
public record SignupRequest(
	@Pattern(regexp = "[a-z0-9]{4,20}", message = "아이디는 영문 소문자·숫자 4~20자입니다.") String loginId,
	@NotBlank @Size(min = 8, max = 64, message = "비밀번호는 8~64자입니다.") String password,
	@NotBlank @Email @Size(max = 100) String email,
	@NotBlank @Size(max = 50) String name
) {
}
