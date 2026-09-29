package com.eatomato.backend.order;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.global.security.CurrentMemberId;
import com.eatomato.backend.order.dto.CreateOrderRequest;
import com.eatomato.backend.order.dto.OrderResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

	private final OrderService orderService;

	/** 주문서 제출 → 결제대기 주문. 이어서 결제 승인(/api/payments/confirm)을 부른다. */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public OrderResponse create(@CurrentMemberId Long memberId, @Valid @RequestBody CreateOrderRequest request) {
		return orderService.create(memberId, request);
	}

	/** 고객 취소(결제대기·결제완료만). */
	@PostMapping("/{orderNumber}/cancel")
	public OrderResponse cancel(@CurrentMemberId Long memberId, @PathVariable String orderNumber) {
		return orderService.cancelMine(memberId, orderNumber);
	}

	/** 마이페이지 주문 내역. */
	@GetMapping
	public List<OrderResponse> list(@CurrentMemberId Long memberId) {
		return orderService.listMine(memberId);
	}

	@GetMapping("/{orderNumber}")
	public OrderResponse get(@CurrentMemberId Long memberId, @PathVariable String orderNumber) {
		return orderService.getMine(memberId, orderNumber);
	}
}
