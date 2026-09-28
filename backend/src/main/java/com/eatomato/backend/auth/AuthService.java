package com.eatomato.backend.auth;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.auth.dto.LoginRequest;
import com.eatomato.backend.auth.dto.SignupRequest;
import com.eatomato.backend.auth.dto.TokenResponse;
import com.eatomato.backend.global.config.AppProperties;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.member.Member;
import com.eatomato.backend.member.MemberRepository;
import com.eatomato.backend.member.dto.MemberResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

	private static final String ISSUER = "eatomato";
	private static final SecureRandom RANDOM = new SecureRandom();

	private final MemberRepository memberRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtEncoder jwtEncoder;
	private final AppProperties properties;

	@Transactional
	public TokenResponse signup(SignupRequest request) {
		String email = request.email().trim();
		if (memberRepository.existsByEmail(email)) {
			throw new ApiException(ErrorCode.DUPLICATE_EMAIL);
		}
		String loginId = request.loginId();
		if (loginId == null || loginId.isBlank()) {
			loginId = generateLoginId(email);
		} else if (memberRepository.existsByLoginId(loginId)) {
			throw new ApiException(ErrorCode.DUPLICATE_LOGIN_ID);
		}
		Member member = memberRepository.save(new Member(
			loginId,
			passwordEncoder.encode(request.password()),
			email,
			request.name().trim()));
		return issueToken(member);
	}

	/**
	 * 이메일 앞부분(영문 소문자·숫자만, 최대 12자) + 숫자 4자리로 아이디를 만든다. 예: tomato.kim@… → tomatokim4821
	 */
	private String generateLoginId(String email) {
		String base = email.substring(0, email.indexOf('@')).toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
		if (base.length() > 12) {
			base = base.substring(0, 12);
		}
		if (base.isEmpty()) {
			base = "user";
		}
		String candidate;
		do {
			candidate = base + String.format("%04d", RANDOM.nextInt(10_000));
		} while (memberRepository.existsByLoginId(candidate));
		return candidate;
	}

	public TokenResponse login(LoginRequest request) {
		String identifier = request.loginId().trim();
		Member member = (identifier.contains("@")
			? memberRepository.findByEmail(identifier)
			: memberRepository.findByLoginId(identifier))
			.filter(found -> passwordEncoder.matches(request.password(), found.getPasswordHash()))
			.orElseThrow(() -> new ApiException(ErrorCode.INVALID_CREDENTIALS));
		if (!member.isEnabled()) {
			throw new ApiException(ErrorCode.MEMBER_DISABLED);
		}
		return issueToken(member);
	}

	private TokenResponse issueToken(Member member) {
		Duration ttl = properties.jwt().accessTokenTtl();
		Instant now = Instant.now();
		JwtClaimsSet claims = JwtClaimsSet.builder()
			.issuer(ISSUER)
			.subject(String.valueOf(member.getId()))
			.issuedAt(now)
			.expiresAt(now.plus(ttl))
			.claim("loginId", member.getLoginId())
			// SecurityConfig 가 ROLE_ 접두사를 붙여 권한으로 쓴다. 관리자 API 는 요청마다 DB 권한도 다시 확인한다.
			.claim("roles", List.of(member.getRole().name()))
			.build();
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
		String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
		return TokenResponse.bearer(token, ttl.toSeconds(), MemberResponse.from(member));
	}
}
