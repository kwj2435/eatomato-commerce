package com.eatomato.backend.global.security;

import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.member.MemberRepository;

import lombok.RequiredArgsConstructor;

/**
 * `@CurrentMemberId` 에 JWT subject(회원 PK)를 넣는다.
 * 이용 정지된 회원은 이미 받은 토큰이 남아 있어도 여기서 막는다(회원 API 는 모두 이 경로를 지난다).
 */
@RequiredArgsConstructor
public class CurrentMemberIdArgumentResolver implements HandlerMethodArgumentResolver {

	private final MemberRepository memberRepository;

	@Override
	public boolean supportsParameter(MethodParameter parameter) {
		return parameter.hasParameterAnnotation(CurrentMemberId.class)
			&& Long.class.isAssignableFrom(parameter.getParameterType());
	}

	@Override
	public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
		NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (!(authentication instanceof JwtAuthenticationToken token)) {
			throw new ApiException(ErrorCode.UNAUTHORIZED);
		}
		Long memberId = Long.valueOf(token.getName());
		boolean enabled = memberRepository.findById(memberId).map(member -> member.isEnabled()).orElse(false);
		if (!enabled) {
			throw new ApiException(ErrorCode.MEMBER_DISABLED);
		}
		return memberId;
	}
}
