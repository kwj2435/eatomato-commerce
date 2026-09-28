package com.eatomato.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupRequest(
	@NotBlank @Pattern(regexp = "[a-z0-9]{4,20}", message = "아이디는 영문 소문자·숫자 4~20자입니다.") String loginId,
	@NotBlank @Size(min = 8, max = 64, message = "비밀번호는 8~64자입니다.") String password,
	@NotBlank @Email @Size(max = 100) String email,
	@NotBlank @Size(max = 50) String name
) {
}
