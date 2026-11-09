package com.eatomato.backend.insight;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * /internal/** 는 같은 서버의 Python 워커만 부른다. 공유 토큰(X-Internal-Token)이 맞아야 하고, 토큰이 설정되지 않았으면 모두 막는다.
 * 운영 nginx 는 /api/·/uploads/ 만 백엔드로 보내므로 이 경로는 인터넷에서 닿지 않는다(토큰은 그 위의 한 겹 더).
 * 틀리면 경로가 있다는 것도 알리지 않도록 404 로 답한다.
 */
@Component
@RequiredArgsConstructor
public class InternalTokenInterceptor implements HandlerInterceptor {

	public static final String HEADER = "X-Internal-Token";

	private final InsightProperties properties;

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
		String given = request.getHeader(HEADER);
		if (!properties.enabled() || given == null || !MessageDigest.isEqual(
			properties.agentToken().getBytes(StandardCharsets.UTF_8), given.getBytes(StandardCharsets.UTF_8))) {
			throw new ApiException(ErrorCode.INTERNAL_ACCESS_DENIED);
		}
		return true;
	}
}
