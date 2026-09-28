package com.eatomato.backend.cart.dto;

import java.util.Map;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * 장바구니 담기.
 *
 * @param productId 상품 id (상품 응답의 id)
 * @param options   옵션 그룹 id → 선택지 id. 예: {"color": "cream", "mount": "macsafe"}.
 *                  상품의 옵션 그룹마다 하나씩 모두 골라야 한다.
 */
public record AddCartItemRequest(
	@NotNull Long productId,
	Map<String, String> options,
	@Min(1) @Max(99) int quantity
) {
}
