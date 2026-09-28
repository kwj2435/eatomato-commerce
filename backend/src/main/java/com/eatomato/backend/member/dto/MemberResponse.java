package com.eatomato.backend.member.dto;

import java.util.ArrayList;
import java.util.List;

import com.eatomato.backend.member.Member;

/**
 * 회원 정보. 프론트 `Member` 타입(src/types/member.ts)과 같은 형태.
 * id 는 DB PK 가 아니라 로그인 아이디다.
 */
public record MemberResponse(
	String id,
	String email,
	String name,
	String grade,
	Phone phone,
	Address address,
	BirthDate birthDate,
	String gender,
	List<String> marketingChannels,
	/** "USER" | "ADMIN". 프론트가 관리자 메뉴 노출 여부를 판단한다. */
	String role
) {

	public record Phone(String first, String middle, String last) {
	}

	public record Address(String zipCode, String road, String detail) {
	}

	public record BirthDate(int year, int month, int day) {
	}

	public static MemberResponse from(Member member) {
		List<String> channels = new ArrayList<>();
		if (member.isMarketingEmail()) {
			channels.add("email");
		}
		if (member.isMarketingSms()) {
			channels.add("sms");
		}
		return new MemberResponse(
			member.getLoginId(),
			member.getEmail(),
			member.getName(),
			member.getGrade(),
			new Phone(orEmpty(member.getPhoneFirst()), orEmpty(member.getPhoneMiddle()),
				orEmpty(member.getPhoneLast())),
			new Address(orEmpty(member.getZipCode()), orEmpty(member.getRoadAddress()),
				orEmpty(member.getDetailAddress())),
			member.getBirthDate() == null ? null : new BirthDate(member.getBirthDate().getYear(),
				member.getBirthDate().getMonthValue(), member.getBirthDate().getDayOfMonth()),
			member.getGender() == null ? null : member.getGender().value(),
			channels,
			member.getRole().name());
	}

	private static String orEmpty(String value) {
		return value == null ? "" : value;
	}
}
