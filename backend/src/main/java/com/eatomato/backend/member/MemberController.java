package com.eatomato.backend.member;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.global.security.CurrentMemberId;
import com.eatomato.backend.member.dto.MemberResponse;
import com.eatomato.backend.member.dto.MemberUpdateRequest;
import com.eatomato.backend.member.dto.PasswordChangeRequest;
import com.eatomato.backend.member.dto.ProfileRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MemberController {

	private final MemberService memberService;

	@GetMapping
	public MemberResponse me(@CurrentMemberId Long memberId) {
		return memberService.getMe(memberId);
	}

	@PatchMapping
	public MemberResponse update(@CurrentMemberId Long memberId, @Valid @RequestBody MemberUpdateRequest request) {
		return memberService.updateMe(memberId, request);
	}

	/** 가입 후 추가 정보(닉네임·주소). */
	@PutMapping("/profile")
	public MemberResponse completeProfile(@CurrentMemberId Long memberId, @Valid @RequestBody ProfileRequest request) {
		return memberService.completeProfile(memberId, request);
	}

	@PutMapping("/password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void changePassword(@CurrentMemberId Long memberId, @Valid @RequestBody PasswordChangeRequest request) {
		memberService.changePassword(memberId, request);
	}
}
