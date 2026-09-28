package com.eatomato.backend.order.dto;

import java.time.OffsetDateTime;
import java.util.List;

import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.order.Order;
import com.eatomato.backend.order.OrderItem;
import com.fasterxml.jackson.annotation.JsonInclude;

public record OrderResponse(
	String orderNumber,
	String status,
	OffsetDateTime orderedAt,
	int subtotal,
	int shippingFee,
	int total,
	List<Item> items
) {

	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record Item(
		String id,
		String productId,
		String slug,
		String name,
		String option,
		int unitPrice,
		int quantity,
		String imageUrl,
		boolean reviewed
	) {

		static Item from(OrderItem item) {
			return new Item(
				String.valueOf(item.getId()),
				String.valueOf(item.getProductId()),
				item.getProductSlug(),
				item.getProductName(),
				item.getOptionLabel(),
				item.getUnitPrice(),
				item.getQuantity(),
				item.getImageUrl(),
				item.isReviewed());
		}
	}

	public static OrderResponse from(Order order) {
		return new OrderResponse(
			order.getOrderNumber(),
			order.getStatus().name(),
			Times.toOffset(order.getOrderedAt()),
			order.getSubtotal(),
			order.getShippingFee(),
			order.getTotal(),
			order.getItems().stream().map(Item::from).toList());
	}
}
