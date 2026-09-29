package com.eatomato.backend.shipping;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShippingPolicyService {

	private final ShippingPolicyRepository repository;

	public ShippingPolicy current() {
		return repository.findById(ShippingPolicy.SINGLE_ROW_ID)
			.orElseThrow(() -> new IllegalStateException("배송비 정책(shipping_policy id=1)이 없습니다."));
	}

	@Transactional
	public ShippingPolicy update(int baseFee, int freeThreshold, int remoteAreaFee) {
		ShippingPolicy policy = current();
		policy.update(baseFee, freeThreshold, remoteAreaFee);
		return policy;
	}
}
