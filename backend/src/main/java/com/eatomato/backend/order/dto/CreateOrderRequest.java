package com.eatomato.backend.order.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 주문서 제출. 주문은 결제대기로 만들어지고, 결제 승인 후 결제완료가 된다.
 *
 * @param cartItemIds 주문할 장바구니 항목. 비우면 장바구니에서 선택된 항목 전체.
 * @param memberCouponId 쓸 쿠폰(내 쿠폰 id). 주문당 1장.
 * @param usePoints 쓸 적립금(원). 결제할 금액(상품 금액 - 쿠폰 + 배송비)까지.
 */
public record CreateOrderRequest(List<Long> cartItemIds, @NotNull @Valid Shipping shipping, Long memberCouponId,
	@Min(0) Integer usePoints) {

	public record Shipping(
		@NotBlank @Size(max = 50) String recipientName,
		@NotBlank @Pattern(regexp = "0\\d{1,2}-?\\d{3,4}-?\\d{4}", message = "연락처 형식을 확인해 주세요.") String recipientPhone,
		@NotBlank @Pattern(regexp = "\\d{5}", message = "우편번호는 5자리입니다.") String zipCode,
		@NotBlank @Size(max = 200) String roadAddress,
		@Size(max = 200) String detailAddress,
		@Size(max = 200) String deliveryMemo) {
	}
}
