package com.eatomato.backend.member;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.member.dto.MemberResponse;
import com.eatomato.backend.member.dto.MemberUpdateRequest;
import com.eatomato.backend.member.dto.PasswordChangeRequest;
import com.eatomato.backend.member.dto.ProfileRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

	private final MemberRepository memberRepository;
	private final PasswordEncoder passwordEncoder;

	public MemberResponse getMe(Long memberId) {
		return MemberResponse.from(find(memberId));
	}

	@Transactional
	public MemberResponse updateMe(Long memberId, MemberUpdateRequest request) {
		Member member = find(memberId);

		if (request.email() != null && !request.email().equals(member.getEmail())) {
			if (memberRepository.existsByEmailAndIdNot(request.email(), memberId)) {
				throw new ApiException(ErrorCode.DUPLICATE_EMAIL);
			}
			member.changeEmail(request.email());
		}
		if (request.name() != null) {
			member.changeName(request.name().trim());
		}
		if (request.nickname() != null) {
			changeNickname(member, request.nickname());
		}
		if (request.phone() != null) {
			member.changePhone(request.phone().first(), request.phone().middle(), request.phone().last());
		}
		if (request.address() != null) {
			member.changeAddress(request.address().zipCode(), request.address().road(), request.address().detail());
		}
		if (request.birthDate() != null) {
			member.changeBirthDate(toDate(request.birthDate()));
		}
		if (request.gender() != null) {
			member.changeGender(Gender.from(request.gender()));
		}
		if (request.marketingChannels() != null) {
			List<String> channels = request.marketingChannels();
			member.changeMarketing(channels.contains("email"), channels.contains("sms"));
		}
		return MemberResponse.from(member);
	}

	/** 가입 후 추가 정보(닉네임·주소) 저장. */
	@Transactional
	public MemberResponse completeProfile(Long memberId, ProfileRequest request) {
		Member member = find(memberId);
		changeNickname(member, request.nickname());
		member.changeAddress(request.zipCode(), request.roadAddress().trim(),
			request.detailAddress() == null ? "" : request.detailAddress().trim());
		return MemberResponse.from(member);
	}

	private void changeNickname(Member member, String nickname) {
		String trimmed = nickname.trim();
		if (memberRepository.existsByNicknameAndIdNot(trimmed, member.getId())) {
			throw new ApiException(ErrorCode.DUPLICATE_NICKNAME);
		}
		member.changeNickname(trimmed);
	}

	@Transactional
	public void changePassword(Long memberId, PasswordChangeRequest request) {
		Member member = find(memberId);
		if (!passwordEncoder.matches(request.currentPassword(), member.getPasswordHash())) {
			throw new ApiException(ErrorCode.INVALID_PASSWORD);
		}
		member.changePasswordHash(passwordEncoder.encode(request.newPassword()));
	}

	private Member find(Long memberId) {
		return memberRepository.findById(memberId).orElseThrow(() -> new ApiException(ErrorCode.MEMBER_NOT_FOUND));
	}

	private static LocalDate toDate(MemberUpdateRequest.BirthDate birthDate) {
		try {
			return LocalDate.of(birthDate.year(), birthDate.month(), birthDate.day());
		} catch (DateTimeException e) {
			throw new ApiException(ErrorCode.INVALID_REQUEST);
		}
	}
}
