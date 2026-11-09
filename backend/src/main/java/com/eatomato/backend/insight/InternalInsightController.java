package com.eatomato.backend.insight;

import java.time.OffsetDateTime;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.global.time.Times;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Python 워커(insight-agent) 전용. InternalTokenInterceptor 가 공유 토큰을 확인한다.
 * 흐름: claim(대기 실행 가져오기) → dataset(원자료)·suggestions/context(지난 제안) → complete(결과).
 */
@RestController
@RequestMapping("/internal/insights")
@RequiredArgsConstructor
public class InternalInsightController {

	private final InsightRunService insightRunService;
	private final InsightDatasetService insightDatasetService;
	private final InsightSuggestionService insightSuggestionService;

	/** 대기 중인 실행을 하나 가져간다. 없으면 204. */
	@PostMapping("/runs/claim")
	public ResponseEntity<ClaimedRun> claim() {
		return insightRunService.claim()
			.map(run -> ResponseEntity.ok(new ClaimedRun(run.getId(), run.getKind().name(), Times.toOffset(run.getCreatedAt()))))
			.orElseGet(() -> ResponseEntity.noContent().build());
	}

	@PostMapping("/runs/{id}/complete")
	public ResponseEntity<Void> complete(@PathVariable Long id,
		@Valid @RequestBody InsightRunService.CompleteRequest request) {
		insightRunService.complete(id, request);
		return ResponseEntity.noContent().build();
	}

	/** 지난 제안(중복 방지)과 효과를 확인할 완료 제안. */
	@GetMapping("/suggestions/context")
	public InsightSuggestionService.Context suggestionContext() {
		return insightSuggestionService.context();
	}

	/** 최근 days 일(최대 90) 원자료. */
	@GetMapping("/dataset")
	public InsightDataset dataset(@RequestParam(defaultValue = "56") int days) {
		return insightDatasetService.build(days);
	}

	/** kind: DAILY(매일 아침 자동) · MANUAL(관리자 요청). 분석 내용은 같다. */
	public record ClaimedRun(Long id, String kind, OffsetDateTime requestedAt) {
	}
}
