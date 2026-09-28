package com.eatomato.backend.auth.token;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.eatomato.backend.global.time.Times;

@Entity
@Table(name = "refresh_token")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long memberId;

	private String tokenHash;

	private LocalDateTime expiresAt;

	private LocalDateTime createdAt;

	private LocalDateTime revokedAt;

	RefreshToken(Long memberId, String tokenHash, LocalDateTime expiresAt) {
		this.memberId = memberId;
		this.tokenHash = tokenHash;
		this.expiresAt = expiresAt;
		this.createdAt = Times.now();
	}

	boolean isUsable() {
		return revokedAt == null && expiresAt.isAfter(Times.now());
	}

	void revoke() {
		if (revokedAt == null) {
			revokedAt = Times.now();
		}
	}
}
