package com.eatomato.backend.analytics;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 구매 단계 이벤트 기록 요청.
 *
 * @param productId   ADD_TO_CART 의 상품 id
 * @param quantity    ADD_TO_CART 의 수량
 * @param orderNumber CHECKOUT_START·PURCHASE 의 주문번호. 금액은 서버가 주문에서 읽는다(요청 값을 믿지 않는다).
 */
public record AnalyticsEventRequest(
	@NotBlank @Pattern(regexp = PageViewRequest.UUID) String visitorId,
	@NotBlank @Pattern(regexp = PageViewRequest.UUID) String sessionId,
	@NotNull AnalyticsEvent.Type type,
	Long productId,
	@Min(1) @Max(1000) Integer quantity,
	@Size(max = 30) String orderNumber
) {
}
