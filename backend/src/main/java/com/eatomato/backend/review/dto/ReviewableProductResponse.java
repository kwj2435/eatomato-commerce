package com.eatomato.backend.review.dto;

import com.eatomato.backend.order.OrderItem;

/**
 * 후기 작성 대상(구매 상품) 선택지.
 * 프론트 `ReviewableProduct`(slug, name)에 후기 저장 시 필요한 orderItemId 를 더했다.
 */
public record ReviewableProductResponse(String orderItemId, String slug, String name, String option) {

	public static ReviewableProductResponse from(OrderItem item) {
		return new ReviewableProductResponse(
			String.valueOf(item.getId()),
			item.getProductSlug(),
			item.getProductName(),
			item.getOptionLabel());
	}
}
