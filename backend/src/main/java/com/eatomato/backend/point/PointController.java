package com.eatomato.backend.point;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.global.security.CurrentMemberId;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/me/points")
@RequiredArgsConstructor
public class PointController {

	private final PointService pointService;

	/** 내 적립금 잔액과 최근 내역. 주문서의 "적립금 사용" 에서도 잔액을 여기서 받는다. */
	@GetMapping
	public PointService.PointsResponse mine(@CurrentMemberId Long memberId) {
		return pointService.summary(memberId);
	}
}
