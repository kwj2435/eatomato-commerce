package com.eatomato.backend.cart.dto;

import java.util.List;

import com.eatomato.backend.cart.CartItem;
import com.eatomato.backend.shipping.ShippingPolicy;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 장바구니 전체. 요약값은 선택된 항목만 합산하고, 배송비는 관리자가 정한 배송비 정책으로 계산한다
 * (배송지를 모르는 단계라 제주 추가 배송비는 주문서에서 더한다).
 */
public record CartResponse(List<Item> items, Summary summary, Policy shippingPolicy) {

	/**
	 * @param available 지금 주문할 수 있는지(판매 중 + 재고 충분). false 면 주문서로 넘길 수 없다.
	 * @param stock     남은 재고. 재고를 관리하지 않는 상품은 null.
	 */
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
		boolean selected,
		boolean available,
		Integer stock
	) {

		static Item from(CartItem item) {
			var product = item.getProduct();
			return new Item(
				String.valueOf(item.getId()),
				String.valueOf(product.getId()),
				product.getSlug(),
				product.getName(),
				item.getOptionLabel(),
				item.unitPrice(),
				product.getImageUrl(),
				item.getQuantity(),
				item.isSelected(),
				product.isOnSale() && product.hasStockFor(item.getQuantity()),
				product.getStockQuantity());
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

	/** 배송비 정책. 화면 안내 문구를 이 값으로 만든다. */
	public record Policy(int freeThreshold, int standardFee, int remoteAreaFee) {
	}

	public static CartResponse from(List<CartItem> items, ShippingPolicy policy) {
		List<CartItem> selected = items.stream().filter(CartItem::isSelected).toList();
		int subtotal = selected.stream().mapToInt(CartItem::lineTotal).sum();
		int shippingFee = policy.feeFor(subtotal);
		Summary summary = new Summary(
			items.size(),
			selected.size(),
			subtotal,
			shippingFee,
			subtotal + shippingFee,
			policy.freeShippingRemainder(subtotal));
		return new CartResponse(
			items.stream().map(Item::from).toList(),
			summary,
			new Policy(policy.getFreeThreshold(), policy.getBaseFee(), policy.getRemoteAreaFee()));
	}
}
