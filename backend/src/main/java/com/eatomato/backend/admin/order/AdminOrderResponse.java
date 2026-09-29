package com.eatomato.backend.admin.order;

import java.time.OffsetDateTime;
import java.util.List;

import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.member.Member;
import com.eatomato.backend.order.Order;
import com.eatomato.backend.order.dto.OrderResponse;
import com.eatomato.backend.payment.Payment;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 관리자 주문 한 건: 주문 정보 + 주문자 + 배송지 + 결제.
 *
 * @param nextStatuses 관리자가 지금 바꿀 수 있는 다음 상태(허용 전이). 비어 있으면 더 바꿀 수 없다.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminOrderResponse(
	String orderNumber,
	String status,
	List<String> nextStatuses,
	OffsetDateTime orderedAt,
	OffsetDateTime paidAt,
	OffsetDateTime cancelledAt,
	int subtotal,
	int shippingFee,
	int total,
	List<OrderResponse.Item> items,
	OrderResponse.Shipping shipping,
	PaymentInfo payment,
	Orderer member
) {

	public record Orderer(String id, String loginId, String name) {
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record PaymentInfo(String provider, String status, String paymentKey, int amount, OffsetDateTime approvedAt) {

		static PaymentInfo from(Payment payment) {
			if (payment == null) {
				return null;
			}
			return new PaymentInfo(payment.getProvider(), payment.getStatus().name(), payment.getPaymentKey(),
				payment.getAmount(), payment.getApprovedAt() == null ? null : Times.toOffset(payment.getApprovedAt()));
		}
	}

	public static AdminOrderResponse of(Order order, Member member, Payment payment) {
		OrderResponse base = OrderResponse.from(order);
		return new AdminOrderResponse(
			base.orderNumber(),
			base.status(),
			order.getStatus().nextByAdmin().stream().map(Enum::name).sorted().toList(),
			base.orderedAt(),
			base.paidAt(),
			base.cancelledAt(),
			base.subtotal(),
			base.shippingFee(),
			base.total(),
			base.items(),
			base.shipping(),
			PaymentInfo.from(payment),
			member == null ? null
				: new Orderer(String.valueOf(member.getId()), member.getLoginId(), member.getName()));
	}
}
