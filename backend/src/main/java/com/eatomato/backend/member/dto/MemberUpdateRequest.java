package com.eatomato.backend.member.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 회원 정보 수정(PATCH). null 인 필드는 변경하지 않는다.
 * 아이디·등급은 서버 관리 값이라 받지 않는다.
 */
public record MemberUpdateRequest(
	@Email @Size(max = 100) String email,
	@Size(min = 1, max = 50) String name,
	@Valid Phone phone,
	@Valid Address address,
	@Valid BirthDate birthDate,
	@Pattern(regexp = "male|female", message = "male 또는 female 이어야 합니다.") String gender,
	List<@Pattern(regexp = "email|sms", message = "email 또는 sms 이어야 합니다.") String> marketingChannels
) {

	public record Phone(
		@NotNull @Pattern(regexp = "\\d{2,4}") String first,
		@NotNull @Pattern(regexp = "\\d{3,4}") String middle,
		@NotNull @Pattern(regexp = "\\d{4}") String last) {
	}

	public record Address(
		@NotNull @Size(max = 10) String zipCode,
		@NotNull @Size(max = 200) String road,
		@NotNull @Size(max = 200) String detail) {
	}

	public record BirthDate(
		@Min(1900) @Max(2100) int year,
		@Min(1) @Max(12) int month,
		@Min(1) @Max(31) int day) {
	}
}
