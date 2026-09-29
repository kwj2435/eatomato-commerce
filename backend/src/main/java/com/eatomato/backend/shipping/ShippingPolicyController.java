package com.eatomato.backend.shipping;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/shipping-policy")
@RequiredArgsConstructor
public class ShippingPolicyController {

	private final ShippingPolicyService shippingPolicyService;

	@GetMapping
	public ShippingPolicyResponse get() {
		return ShippingPolicyResponse.from(shippingPolicyService.current());
	}
}
