package com.eatomato.backend.admin.shipping;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.shipping.ShippingPolicyResponse;
import com.eatomato.backend.shipping.ShippingPolicyService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/** 배송비 정책 관리. 바꾼 값은 장바구니·주문 계산에 바로, 상세 페이지 문구에는 1분 안에 반영된다. */
@RestController
@RequestMapping("/api/admin/shipping-policy")
@RequiredArgsConstructor
public class AdminShippingPolicyController {

	private final ShippingPolicyService shippingPolicyService;

	@GetMapping
	public ShippingPolicyResponse get() {
		return ShippingPolicyResponse.from(shippingPolicyService.current());
	}

	@PutMapping
	public ShippingPolicyResponse update(@Valid @RequestBody UpdateRequest request) {
		return ShippingPolicyResponse.from(
			shippingPolicyService.update(request.baseFee(), request.freeThreshold(), request.remoteAreaFee()));
	}

	/** 무료배송 기준을 0 으로 두면 항상 무료배송이다. */
	public record UpdateRequest(
		@Min(0) @Max(1_000_000) int baseFee,
		@Min(0) @Max(100_000_000) int freeThreshold,
		@Min(0) @Max(1_000_000) int remoteAreaFee) {
	}
}
