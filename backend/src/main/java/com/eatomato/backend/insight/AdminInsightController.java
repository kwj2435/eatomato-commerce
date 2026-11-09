package com.eatomato.backend.insight;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.global.security.CurrentMemberId;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/** 관리자 > 마케팅 인사이트. 요청을 쌓고 결과를 본다(처리는 Python 워커). */
@RestController
@RequestMapping("/api/admin/insights/runs")
@RequiredArgsConstructor
public class AdminInsightController {

	private final InsightRunService insightRunService;

	/** 질문이 비어 있으면 주간 리포트. */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public InsightRunResponse request(@CurrentMemberId Long adminId, @Valid @RequestBody RunRequest request) {
		return insightRunService.request(adminId, request.question());
	}

	/** 최근 20건(리포트 본문 제외). */
	@GetMapping
	public List<InsightRunResponse> recent() {
		return insightRunService.recent();
	}

	@GetMapping("/{id}")
	public InsightRunResponse get(@PathVariable Long id) {
		return insightRunService.get(id);
	}

	public record RunRequest(@Size(max = 500) String question) {
	}
}
