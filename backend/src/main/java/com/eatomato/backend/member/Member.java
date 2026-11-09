package com.eatomato.backend.member;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HexFormat;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.eatomato.backend.global.time.Times;

@Entity
@Table(name = "member")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member {

	/** 신규 가입 회원 등급. 등급 산정 정책이 생기면 서버에서 갱신한다. */
	public static final String DEFAULT_GRADE = "Membership Benefit";

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String loginId;

	private String passwordHash;

	private String email;

	private String name;

	/** 공개 표시용 닉네임(후기 작성자 등). 가입 후 추가 정보 입력에서 받는다. */
	private String nickname;

	private String grade;

	private String phoneFirst;

	private String phoneMiddle;

	private String phoneLast;

	private String zipCode;

	private String roadAddress;

	private String detailAddress;

	private LocalDate birthDate;

	@Enumerated(EnumType.STRING)
	private Gender gender;

	private boolean marketingEmail;

	private boolean marketingSms;

	/** 카카오 회원번호. 카카오로 가입·연결한 회원만 있다. */
	private Long kakaoId;

	/** 네이버 회원 식별자. 네이버로 가입·연결한 회원만 있다. */
	private String naverId;

	/** 연계정보(CI)의 SHA-256 해시. 카카오 로그인으로 받은 회원만 있다. 원문은 저장하지 않는다. */
	private String ciHash;

	@Enumerated(EnumType.STRING)
	private MemberRole role;

	/** false 면 이용 정지. 로그인과 API 이용이 막힌다. */
	private boolean enabled;

	/** 가입 약관(이용약관·개인정보 수집·이용·만 14세 이상) 필수 동의 시각. */
	private LocalDateTime termsAgreedAt;

	/** 탈퇴 시각. 탈퇴하면 회원 정보를 지우고 enabled 를 끈다. */
	private LocalDateTime withdrawnAt;

	private LocalDateTime createdAt;

	private LocalDateTime updatedAt;

	public Member(String loginId, String passwordHash, String email, String name) {
		this.loginId = loginId;
		this.passwordHash = passwordHash;
		this.email = email;
		this.name = name;
		this.grade = DEFAULT_GRADE;
		this.role = MemberRole.USER;
		this.enabled = true;
		this.createdAt = Times.now();
		this.updatedAt = this.createdAt;
	}

	@PreUpdate
	void touch() {
		this.updatedAt = Times.now();
	}

	public void changeEmail(String email) {
		this.email = email;
	}

	public void changeNickname(String nickname) {
		this.nickname = nickname;
	}

	/**
	 * 가입 후 추가 정보(닉네임·주소)와 약관 필수 동의를 마쳤는지. 관리자 계정은 확인하지 않는다.
	 * 프론트는 false 면 추가 정보 입력 화면으로 보낸다.
	 */
	public boolean isProfileComplete() {
		return isAdmin() || (hasText(nickname) && hasText(zipCode) && hasText(roadAddress) && termsAgreedAt != null);
	}

	/** 약관 필수 동의를 기록한다. 이미 동의했으면 처음 동의한 시각을 그대로 둔다. */
	public void agreeTerms() {
		if (termsAgreedAt == null) {
			termsAgreedAt = Times.now();
		}
	}

	public boolean isWithdrawn() {
		return withdrawnAt != null;
	}

	/**
	 * 탈퇴: 개인정보를 지우고 이용을 막는다. 행은 주문·결제 기록이 참조하므로 지우지 않는다.
	 * 아이디·이메일은 유일해야 해서 회원 번호로 바꾸고, 소셜 연결을 끊어 같은 계정으로 다시 가입할 수 있게 한다.
	 */
	public void withdraw() {
		this.loginId = "withdrawn_" + id;
		this.email = "withdrawn_" + id + "@withdrawn.invalid";
		this.name = "탈퇴회원";
		this.nickname = null;
		this.phoneFirst = null;
		this.phoneMiddle = null;
		this.phoneLast = null;
		this.zipCode = null;
		this.roadAddress = null;
		this.detailAddress = null;
		this.birthDate = null;
		this.gender = null;
		this.marketingEmail = false;
		this.marketingSms = false;
		this.kakaoId = null;
		this.naverId = null;
		this.ciHash = null;
		this.enabled = false;
		this.withdrawnAt = Times.now();
	}

	private static boolean hasText(String value) {
		return value != null && !value.isBlank();
	}

	public void changeName(String name) {
		this.name = name;
	}

	public void changePhone(String first, String middle, String last) {
		this.phoneFirst = first;
		this.phoneMiddle = middle;
		this.phoneLast = last;
	}

	public void changeAddress(String zipCode, String road, String detail) {
		this.zipCode = zipCode;
		this.roadAddress = road;
		this.detailAddress = detail;
	}

	public void changeBirthDate(LocalDate birthDate) {
		this.birthDate = birthDate;
	}

	public void changeGender(Gender gender) {
		this.gender = gender;
	}

	public void changeMarketing(boolean email, boolean sms) {
		this.marketingEmail = email;
		this.marketingSms = sms;
	}

	public void changeGrade(String grade) {
		this.grade = grade;
	}

	public void changeRole(MemberRole role) {
		this.role = role;
	}

	public void changeEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public void linkKakao(Long kakaoId) {
		this.kakaoId = kakaoId;
	}

	public void linkNaver(String naverId) {
		this.naverId = naverId;
	}

	/** @param ciHash hashCi() 로 만든 값 */
	public void linkCi(String ciHash) {
		this.ciHash = ciHash;
	}

	public boolean hasPhone() {
		return hasText(phoneFirst) && hasText(phoneMiddle) && hasText(phoneLast);
	}

	/** 연계정보(CI) → SHA-256 16진수. 같은 사람이면 어느 서비스 계정으로 받아도 같은 값이 나온다. */
	public static String hashCi(String ci) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(ci.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(e);
		}
	}

	public boolean isAdmin() {
		return role == MemberRole.ADMIN;
	}
}
