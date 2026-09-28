package com.eatomato.backend.member;

import java.time.LocalDate;
import java.time.LocalDateTime;

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

	private LocalDateTime createdAt;

	private LocalDateTime updatedAt;

	public Member(String loginId, String passwordHash, String email, String name) {
		this.loginId = loginId;
		this.passwordHash = passwordHash;
		this.email = email;
		this.name = name;
		this.grade = DEFAULT_GRADE;
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

	public void changePasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}
}
