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
	private final AnalyticsEventService analyticsEventService;

	@PostMapping("/api/analytics/pageview")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void record(@Valid @RequestBody PageViewRequest request,
		@RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent,
		HttpServletRequest servletRequest) {
		pageViewService.record(request, userAgent, servletRequest.getServerName());
	}

	/** 구매 단계 이벤트(담기·결제 시도·결제 완료). */
	@PostMapping("/api/analytics/event")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void event(@Valid @RequestBody AnalyticsEventRequest request,
		@RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent) {
		analyticsEventService.record(request, userAgent);
	}
}
