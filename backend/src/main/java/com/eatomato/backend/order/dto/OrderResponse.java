package com.eatomato.backend.order.dto;

import java.time.OffsetDateTime;
import java.util.List;

import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.order.Order;
import com.eatomato.backend.order.OrderItem;
import com.eatomato.backend.order.ShippingAddress;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 주문. cancellable 이면 고객이 직접 취소할 수 있다(결제대기·결제완료).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record OrderResponse(
	String orderNumber,
	String status,
	OffsetDateTime orderedAt,
	OffsetDateTime paidAt,
	OffsetDateTime cancelledAt,
	int subtotal,
	int shippingFee,
	int total,
	boolean cancellable,
	Shipping shipping,
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

	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record Shipping(String recipientName, String recipientPhone, String zipCode, String roadAddress,
		String detailAddress, String deliveryMemo) {

		static Shipping from(ShippingAddress address) {
			if (address == null || address.getRecipientName() == null) {
				return null;
			}
			return new Shipping(address.getRecipientName(), address.getRecipientPhone(), address.getZipCode(),
				address.getRoadAddress(), address.getDetailAddress(), address.getDeliveryMemo());
		}
	}

	public static OrderResponse from(Order order) {
		return new OrderResponse(
			order.getOrderNumber(),
			order.getStatus().name(),
			Times.toOffset(order.getOrderedAt()),
			order.getPaidAt() == null ? null : Times.toOffset(order.getPaidAt()),
			order.getCancelledAt() == null ? null : Times.toOffset(order.getCancelledAt()),
			order.getSubtotal(),
			order.getShippingFee(),
			order.getTotal(),
			order.getStatus().isCancellable(),
			Shipping.from(order.getShippingAddress()),
			order.getItems().stream().map(Item::from).toList());
	}
}
