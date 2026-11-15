package com.eatomato.backend.admin.analytics;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.analytics.AnalyticsMonthlyService;
import com.eatomato.backend.analytics.MonthlyStats;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
public class AdminAnalyticsController {

	private final AdminAnalyticsService adminAnalyticsService;
	private final AnalyticsMonthlyService analyticsMonthlyService;

	/** days: 오늘 포함 며칠(1~90, 기본 7). 그보다 긴 추세는 /monthly 로 본다. */
	@GetMapping
	public AnalyticsResponse get(@RequestParam(defaultValue = "7") int days) {
		return adminAnalyticsService.get(days);
	}

	/** 월별 방문·구매 합계(오래된 달부터, 마지막은 진행 중인 이번 달). 원본이 지워진 달도 합계는 남는다. */
	@GetMapping("/monthly")
	public List<MonthlyStats> monthly() {
		return analyticsMonthlyService.months();
	}
}
