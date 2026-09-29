package com.eatomato.backend.order;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 주문 시점의 배송지 스냅샷. 회원 주소를 나중에 바꿔도 주문 배송지는 그대로다. */
@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class ShippingAddress {

	@Column(name = "recipient_name")
	private String recipientName;

	@Column(name = "recipient_phone")
	private String recipientPhone;

	@Column(name = "zip_code")
	private String zipCode;

	@Column(name = "road_address")
	private String roadAddress;

	@Column(name = "detail_address")
	private String detailAddress;

	@Column(name = "delivery_memo")
	private String deliveryMemo;
}
