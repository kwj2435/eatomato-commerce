package com.eatomato.backend.admin;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.member.MemberRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * 관리자 API 권한 판단은 여기서만 한다: 요청마다 DB 의 권한·이용 상태를 확인한다.
 * 토큰의 roles 클레임은 발급 시점 값이라, 그걸로 판단하면 권한을 주거나 뺀 뒤 토큰이 바뀔 때까지 어긋난다.
 */
@Component
@RequiredArgsConstructor
public class AdminAccessInterceptor implements HandlerInterceptor {

	private final MemberRepository memberRepository;

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (!(authentication instanceof JwtAuthenticationToken token)) {
			throw new ApiException(ErrorCode.UNAUTHORIZED);
		}
		boolean allowed = memberRepository.findById(Long.valueOf(token.getName()))
			.map(member -> member.isAdmin() && member.isEnabled())
			.orElse(false);
		if (!allowed) {
			throw new ApiException(ErrorCode.FORBIDDEN);
		}
		return true;
	}
}
