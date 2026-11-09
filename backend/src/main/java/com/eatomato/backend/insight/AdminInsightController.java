package com.eatomato.backend.insight;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.global.security.CurrentMemberId;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;

/** 관리자 > 개선 제안. 분석은 매일 아침 자동으로 돌고(Python 워커), 관리자는 제안 상태를 관리한다. */
@RestController
@RequestMapping("/api/admin/insights")
@RequiredArgsConstructor
public class AdminInsightController {

	private final InsightRunService insightRunService;
	private final InsightSuggestionService insightSuggestionService;

	/** 최근 분석(요약 포함)·진행 중인 분석·상태별 제안 수. */
	@GetMapping("/overview")
	public InsightRunService.Overview overview() {
		return insightRunService.overview();
	}

	@GetMapping("/suggestions")
	public List<InsightSuggestionService.SuggestionResponse> suggestions() {
		return insightSuggestionService.list();
	}

	/** 채택·보류·제외·완료. 완료 7일 뒤 에이전트가 효과를 확인한다. */
	@PatchMapping("/suggestions/{id}/status")
	public InsightSuggestionService.SuggestionResponse changeStatus(@PathVariable Long id,
		@Valid @RequestBody StatusRequest request) {
		return insightSuggestionService.changeStatus(id, request.status());
	}

	/** '지금 분석하기'(하루 횟수 제한). */
	@PostMapping("/runs")
	@ResponseStatus(HttpStatus.CREATED)
	public InsightRunResponse request(@CurrentMemberId Long adminId) {
		return insightRunService.request(adminId);
	}

	/** 최근 20건(리포트 본문 제외). */
	@GetMapping("/runs")
	public List<InsightRunResponse> recent() {
		return insightRunService.recent();
	}

	@GetMapping("/runs/{id}")
	public InsightRunResponse get(@PathVariable Long id) {
		return insightRunService.get(id);
	}

	public record StatusRequest(@NotNull InsightSuggestion.Status status) {
	}
}
