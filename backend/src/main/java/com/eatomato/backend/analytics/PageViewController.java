package com.eatomato.backend.analytics;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** 스토어 페이지 조회 기록. 로그인 없이 받는다(SecurityConfig). */
@RestController
@RequiredArgsConstructor
public class PageViewController {

	private final PageViewService pageViewService;

	@PostMapping("/api/analytics/pageview")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void record(@Valid @RequestBody PageViewRequest request,
		@RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent,
		HttpServletRequest servletRequest) {
		pageViewService.record(request, userAgent, servletRequest.getServerName());
	}
}
