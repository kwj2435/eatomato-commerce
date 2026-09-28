package com.eatomato.backend.admin.member;

import java.time.OffsetDateTime;

import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.member.Member;

/** 관리자 회원 목록 한 줄. id 는 DB PK, loginId 는 로그인 아이디. */
public record AdminMemberSummary(
	String id,
	String loginId,
	String name,
	String email,
	String phone,
	String grade,
	String role,
	boolean enabled,
	long orderCount,
	long totalSpent,
	OffsetDateTime createdAt
) {

	public static AdminMemberSummary of(Member member, long orderCount, long totalSpent) {
		return new AdminMemberSummary(
			String.valueOf(member.getId()),
			member.getLoginId(),
			member.getName(),
			member.getEmail(),
			phoneOf(member),
			member.getGrade(),
			member.getRole().name(),
			member.isEnabled(),
			orderCount,
			totalSpent,
			Times.toOffset(member.getCreatedAt()));
	}

	static String phoneOf(Member member) {
		if (member.getPhoneFirst() == null || member.getPhoneFirst().isBlank()) {
			return null;
		}
		return member.getPhoneFirst() + "-" + member.getPhoneMiddle() + "-" + member.getPhoneLast();
	}
}
