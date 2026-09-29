package com.eatomato.backend.shipping;

import java.time.OffsetDateTime;

import com.eatomato.backend.global.time.Times;

/** 배송비 정책. 프론트가 안내 문구(예: "3,000원 · 80,000원 이상 무료")를 이 값으로 만든다. */
public record ShippingPolicyResponse(int baseFee, int freeThreshold, int remoteAreaFee, OffsetDateTime updatedAt) {

	public static ShippingPolicyResponse from(ShippingPolicy policy) {
		return new ShippingPolicyResponse(policy.getBaseFee(), policy.getFreeThreshold(), policy.getRemoteAreaFee(),
			Times.toOffset(policy.getUpdatedAt()));
	}
}
