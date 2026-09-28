package com.eatomato.backend.cart;

/** 배송비 정책. 프론트 `SHIPPING_POLICY`(src/types/cart.ts)와 같은 값. */
public final class ShippingPolicy {

	public static final int FREE_THRESHOLD = 80_000;
	public static final int STANDARD_FEE = 3_000;

	private ShippingPolicy() {
	}

	/** 선택 상품이 없으면 0, 무료배송 기준 이상이면 0, 그 외에는 기본 배송비. */
	public static int feeFor(int subtotal) {
		return subtotal == 0 || subtotal >= FREE_THRESHOLD ? 0 : STANDARD_FEE;
	}
}
