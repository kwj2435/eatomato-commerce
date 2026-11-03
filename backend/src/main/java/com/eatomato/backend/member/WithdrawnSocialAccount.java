package com.eatomato.backend.member;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.eatomato.backend.global.time.Times;

/**
 * 탈퇴한 소셜 계정 기록. 식별값 원문 대신 SHA-256 해시만 둔다.
 * 같은 계정으로 다시 가입할 때 신규가입 쿠폰을 또 주지 않으려는 용도이며, 탈퇴 후 1년이 지나면 지운다.
 */
@Entity
@Table(name = "withdrawn_social_account")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WithdrawnSocialAccount {

	public static final String KAKAO = "KAKAO";
	public static final String NAVER = "NAVER";

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String provider;

	private String idHash;

	private LocalDateTime withdrawnAt;

	WithdrawnSocialAccount(String provider, String idHash) {
		this.provider = provider;
		this.idHash = idHash;
		this.withdrawnAt = Times.now();
	}

	/** provider 와 식별값을 묶어 해시한다(카카오 회원번호와 네이버 식별자가 우연히 같아도 섞이지 않게). */
	public static String hash(String provider, String socialId) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256")
				.digest((provider + ":" + socialId).getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(e);
		}
	}
}
