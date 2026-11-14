package com.eatomato.backend.analytics;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 화면 안 행동 기록 요청.
 *
 * @param section   SECTION_* 의 메인 섹션 이름(소문자·숫자·하이픈)
 * @param itemIndex 섹션 안 몇 번째 링크인지, 몇 번째 사진인지(0부터)
 * @param productId PRODUCT_* 의 상품 id
 * @param detail    누른 주소(경로), 고른 옵션, 탭 id, 후기 행동
 */
public record InteractionEventRequest(
	@NotBlank @Pattern(regexp = PageViewRequest.UUID) String visitorId,
	@NotBlank @Pattern(regexp = PageViewRequest.UUID) String sessionId,
	@NotNull InteractionEvent.Type type,
	@Pattern(regexp = "^[a-z0-9-]{1,30}$") String section,
	@Min(0) @Max(999) Integer itemIndex,
	@Min(1) Long productId,
	@Size(max = 300) String detail
) {
}
