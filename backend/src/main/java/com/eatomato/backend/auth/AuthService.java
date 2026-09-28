package com.eatomato.backend.auth;

import java.time.Duration;
import java.time.Instant;

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

	private final MemberRepository memberRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtEncoder jwtEncoder;
	private final AppProperties properties;

	@Transactional
	public TokenResponse signup(SignupRequest request) {
		if (memberRepository.existsByLoginId(request.loginId())) {
			throw new ApiException(ErrorCode.DUPLICATE_LOGIN_ID);
		}
		if (memberRepository.existsByEmail(request.email())) {
			throw new ApiException(ErrorCode.DUPLICATE_EMAIL);
		}
		Member member = memberRepository.save(new Member(
			request.loginId(),
			passwordEncoder.encode(request.password()),
			request.email(),
			request.name().trim()));
		return issueToken(member);
	}

	public TokenResponse login(LoginRequest request) {
		String identifier = request.loginId().trim();
		Member member = (identifier.contains("@")
			? memberRepository.findByEmail(identifier)
			: memberRepository.findByLoginId(identifier))
			.filter(found -> passwordEncoder.matches(request.password(), found.getPasswordHash()))
			.orElseThrow(() -> new ApiException(ErrorCode.INVALID_CREDENTIALS));
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
			.build();
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
		String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
		return TokenResponse.bearer(token, ttl.toSeconds(), MemberResponse.from(member));
	}
}
