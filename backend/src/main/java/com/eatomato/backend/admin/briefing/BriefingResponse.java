package com.eatomato.backend.admin.briefing;

import java.time.OffsetDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 관리자 대시보드의 오늘의 브리핑.
 *
 * @param items 할 일. 긴급 → 확인 → 참고 순. 비어 있으면 지금 처리할 일이 없다.
 */
public record BriefingResponse(
	OffsetDateTime generatedAt,
	BriefingFacts.Day yesterday,
	BriefingFacts.Day sameDayLastWeek,
	List<Item> items
) {

	/** 긴급(바로 처리), 확인(오늘 안에 볼 것), 참고(알아 두면 좋은 것). 선언 순서가 화면 순서다. */
	public enum Level {
		URGENT, WARNING, INFO
	}

	/**
	 * @param kind   항목 종류(PAID_WAITING, LOW_STOCK 등). 화면 키·나중의 AI 요약에서 쓴다.
	 * @param detail 한 줄 설명. 없으면 생략
	 * @param link   바로 갈 화면(관리자·스토어 경로). 갈 곳이 없으면 생략
	 */
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record Item(Level level, String kind, String title, String detail, String link) {
	}
}
