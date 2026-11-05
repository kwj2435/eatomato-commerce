package com.eatomato.backend.admin.analytics;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
public class AdminAnalyticsController {

	private final AdminAnalyticsService adminAnalyticsService;

	/** days: 오늘 포함 며칠(1~90, 기본 7). 기록은 3개월만 남는다. */
	@GetMapping
	public AnalyticsResponse get(@RequestParam(defaultValue = "7") int days) {
		return adminAnalyticsService.get(days);
	}
}
