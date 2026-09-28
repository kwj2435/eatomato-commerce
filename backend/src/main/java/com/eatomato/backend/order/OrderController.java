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

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

	private final OrderService orderService;

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public OrderResponse create(@CurrentMemberId Long memberId, @RequestBody(required = false) CreateOrderRequest request) {
		return orderService.create(memberId, request == null ? new CreateOrderRequest(null) : request);
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
