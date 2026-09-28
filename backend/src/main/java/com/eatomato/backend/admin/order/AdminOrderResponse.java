package com.eatomato.backend.admin.order;

import java.time.OffsetDateTime;
import java.util.List;

import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.member.Member;
import com.eatomato.backend.order.Order;
import com.eatomato.backend.order.dto.OrderResponse;

/** 관리자 주문 한 건: 주문 정보 + 주문자. 탈퇴 등으로 회원이 없으면 member 는 null. */
public record AdminOrderResponse(
	String orderNumber,
	String status,
	OffsetDateTime orderedAt,
	int subtotal,
	int shippingFee,
	int total,
	List<OrderResponse.Item> items,
	Orderer member
) {

	public record Orderer(String id, String loginId, String name) {
	}

	public static AdminOrderResponse of(Order order, Member member) {
		OrderResponse base = OrderResponse.from(order);
		return new AdminOrderResponse(
			base.orderNumber(),
			base.status(),
			Times.toOffset(order.getOrderedAt()),
			base.subtotal(),
			base.shippingFee(),
			base.total(),
			base.items(),
			member == null ? null
				: new Orderer(String.valueOf(member.getId()), member.getLoginId(), member.getName()));
	}
}
