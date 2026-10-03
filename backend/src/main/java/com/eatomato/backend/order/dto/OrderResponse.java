package com.eatomato.backend.order.dto;

import java.time.OffsetDateTime;
import java.util.List;

import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.order.Order;
import com.eatomato.backend.order.OrderItem;
import com.eatomato.backend.order.OrderStatus;
import com.eatomato.backend.order.ShippingAddress;
import com.eatomato.backend.payment.Payment;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 주문. cancellable 이면 고객이 직접 취소할 수 있다(결제대기·입금대기·결제완료).
 * 무통장입금으로 입금까지 끝난 주문은 환불 계좌가 필요해 고객이 직접 취소할 수 없다(고객센터로 안내).
 * payment 는 결제수단과 무통장입금 계좌(입금 안내용)다.
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
	List<Item> items,
	PaymentInfo payment
) {

	/** 결제수단과 무통장입금 계좌. 승인 전이면 method 가 비어 있다. */
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record PaymentInfo(String method, VirtualAccount virtualAccount) {

		static PaymentInfo from(Payment payment) {
			if (payment == null || payment.getMethod() == null) {
				return null;
			}
			VirtualAccount account = payment.isVirtualAccount()
				? new VirtualAccount(payment.getVaBankCode(), payment.getVaAccountNumber(), payment.getVaCustomerName(),
					payment.getVaDueAt() == null ? null : Times.toOffset(payment.getVaDueAt()))
				: null;
			return new PaymentInfo(payment.getMethod(), account);
		}
	}

	/** bankCode 는 토스 은행 코드(예: 88 신한). 은행 이름은 프론트가 붙인다. */
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record VirtualAccount(String bankCode, String accountNumber, String customerName, OffsetDateTime dueAt) {
	}

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
		return from(order, null);
	}

	public static OrderResponse from(Order order, Payment payment) {
		boolean paidByVirtualAccount = order.getStatus() == OrderStatus.PAID && payment != null
			&& payment.isVirtualAccount();
		return new OrderResponse(
			order.getOrderNumber(),
			order.getStatus().name(),
			Times.toOffset(order.getOrderedAt()),
			order.getPaidAt() == null ? null : Times.toOffset(order.getPaidAt()),
			order.getCancelledAt() == null ? null : Times.toOffset(order.getCancelledAt()),
			order.getSubtotal(),
			order.getShippingFee(),
			order.getTotal(),
			order.getStatus().isCancellable() && !paidByVirtualAccount,
			Shipping.from(order.getShippingAddress()),
			order.getItems().stream().map(Item::from).toList(),
			PaymentInfo.from(payment));
	}
}
