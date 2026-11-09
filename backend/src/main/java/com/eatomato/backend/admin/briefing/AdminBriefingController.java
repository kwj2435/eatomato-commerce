package com.eatomato.backend.admin.briefing;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/** 관리자 대시보드의 오늘의 브리핑. 관리자 권한은 AdminAccessInterceptor 가 확인한다. */
@RestController
@RequestMapping("/api/admin/briefing")
@RequiredArgsConstructor
public class AdminBriefingController {

	private final AdminBriefingService adminBriefingService;

	@GetMapping
	public BriefingResponse get() {
		return adminBriefingService.get();
	}
}
