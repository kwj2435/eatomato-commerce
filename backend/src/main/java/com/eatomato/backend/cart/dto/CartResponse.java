package com.eatomato.backend.cart.dto;

import java.util.List;

import com.eatomato.backend.cart.CartItem;
import com.eatomato.backend.cart.ShippingPolicy;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 장바구니 전체. 요약값은 프론트 `computeSummary`(lib/store/cart-store.ts)와 같은 규칙으로
 * 서버가 계산해 내려준다(선택된 항목만 합산).
 */
public record CartResponse(List<Item> items, Summary summary, Policy shippingPolicy) {

	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record Item(
		String id,
		String productId,
		String slug,
		String name,
		String option,
		int unitPrice,
		String imageUrl,
		int quantity,
		boolean selected
	) {

		static Item from(CartItem item) {
			return new Item(
				String.valueOf(item.getId()),
				String.valueOf(item.getProduct().getId()),
				item.getProduct().getSlug(),
				item.getProduct().getName(),
				item.getOptionLabel(),
				item.unitPrice(),
				item.getProduct().getImageUrl(),
				item.getQuantity(),
				item.isSelected());
		}
	}

	public record Summary(
		int itemCount,
		int selectedCount,
		int subtotal,
		int shippingFee,
		int total,
		int freeShippingRemainder
	) {
	}

	public record Policy(int freeThreshold, int standardFee) {
	}

	public static CartResponse from(List<CartItem> items) {
		List<CartItem> selected = items.stream().filter(CartItem::isSelected).toList();
		int subtotal = selected.stream().mapToInt(CartItem::lineTotal).sum();
		int shippingFee = ShippingPolicy.feeFor(subtotal);
		Summary summary = new Summary(
			items.size(),
			selected.size(),
			subtotal,
			shippingFee,
			subtotal + shippingFee,
			Math.max(0, ShippingPolicy.FREE_THRESHOLD - subtotal));
		return new CartResponse(
			items.stream().map(Item::from).toList(),
			summary,
			new Policy(ShippingPolicy.FREE_THRESHOLD, ShippingPolicy.STANDARD_FEE));
	}
}
