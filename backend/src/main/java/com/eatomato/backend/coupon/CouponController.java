package com.eatomato.backend.coupon;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.global.security.CurrentMemberId;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/me/coupons")
@RequiredArgsConstructor
public class CouponController {

	private final CouponService couponService;

	/** 내 쿠폰 전체(사용 가능·사용함·기한 지남). 주문서는 AVAILABLE 만 고른다. */
	@GetMapping
	public List<CouponService.MemberCouponResponse> mine(@CurrentMemberId Long memberId) {
		return couponService.mine(memberId);
	}
}
