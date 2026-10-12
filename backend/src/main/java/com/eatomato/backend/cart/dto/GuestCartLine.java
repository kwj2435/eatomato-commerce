package com.eatomato.backend.cart.dto;

import java.util.Map;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 비회원 장바구니 한 줄. 비회원 장바구니는 브라우저(localStorage)에 두고, 금액 계산·주문 때 이 형태로 보낸다.
 *
 * @param id      브라우저가 붙인 줄 id. 응답에 그대로 돌려준다.
 * @param options 옵션 그룹 id → 선택지 id ({@link AddCartItemRequest} 와 같다)
 */
public record GuestCartLine(
	@NotBlank @Size(max = 40) String id,
	@NotNull Long productId,
	Map<String, String> options,
	@Min(1) @Max(99) int quantity,
	boolean selected
) {
}
