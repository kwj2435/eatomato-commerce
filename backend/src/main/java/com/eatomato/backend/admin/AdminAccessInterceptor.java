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
 * 관리자 API 요청마다 DB 의 권한·이용 상태를 다시 확인한다.
 * 토큰의 roles 클레임만 믿으면 권한을 뺏거나 정지한 관리자가 토큰 만료(최대 2시간)까지 계속 쓸 수 있어서다.
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
