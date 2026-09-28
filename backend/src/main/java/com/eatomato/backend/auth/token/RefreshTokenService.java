package com.eatomato.backend.auth.token;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.global.config.AppProperties;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.global.time.Times;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 리프레시 토큰 발급·교체·폐기.
 *
 * - 원문은 클라이언트에만 있고 서버는 SHA-256 해시만 저장한다.
 * - 한 번 쓰면 폐기하고 새 토큰을 준다(rotation). 폐기된 토큰으로는 다시 받을 수 없다.
 * - 로그아웃은 그 토큰을, 회원 정지는 그 회원의 모든 토큰을 폐기한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

	private static final SecureRandom RANDOM = new SecureRandom();
	/** 폐기된 토큰은 하루 뒤 정리한다(원인 추적용으로 잠깐 남긴다). */
	private static final Duration KEEP_REVOKED = Duration.ofDays(1);

	private final RefreshTokenRepository repository;
	private final AppProperties properties;

	public Duration ttl() {
		return properties.jwt().refreshTokenTtl();
	}

	/** 새 리프레시 토큰을 만들고 원문을 돌려준다. */
	@Transactional
	public String issue(Long memberId) {
		byte[] bytes = new byte[32];
		RANDOM.nextBytes(bytes);
		String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
		repository.save(new RefreshToken(memberId, hash(raw), Times.now().plus(ttl())));
		return raw;
	}

	/** 토큰을 써서 회원 id 를 얻고, 그 토큰은 폐기한다. 호출부가 새 토큰을 발급한다. */
	@Transactional
	public Long consume(String raw) {
		RefreshToken token = repository.findByTokenHash(hash(raw))
			.filter(RefreshToken::isUsable)
			.orElseThrow(() -> new ApiException(ErrorCode.INVALID_REFRESH_TOKEN));
		token.revoke();
		return token.getMemberId();
	}

	@Transactional
	public void revoke(String raw) {
		repository.findByTokenHash(hash(raw)).ifPresent(RefreshToken::revoke);
	}

	@Transactional
	public void revokeAll(Long memberId) {
		repository.revokeAllByMemberId(memberId, Times.now());
	}

	/** 매일 새벽 만료·폐기 토큰을 지운다. */
	@Scheduled(cron = "0 30 4 * * *", zone = "Asia/Seoul")
	@Transactional
	public void cleanUp() {
		int deleted = repository.deleteStale(Times.now(), Times.now().minus(KEEP_REVOKED));
		log.info("리프레시 토큰 정리: {}건", deleted);
	}

	private static String hash(String raw) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(e);
		}
	}
}
