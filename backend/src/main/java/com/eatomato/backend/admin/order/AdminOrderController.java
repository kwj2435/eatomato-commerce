package com.eatomato.backend.admin.order;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.admin.common.PageResponse;
import com.eatomato.backend.global.security.CurrentMemberId;
import com.eatomato.backend.order.OrderStatus;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

	private final AdminOrderService adminOrderService;

	/** 결제·주문 현황. q 는 주문번호 또는 주문자 아이디. */
	@GetMapping
	public PageResponse<AdminOrderResponse> list(
		@RequestParam(required = false) @Pattern(regexp = "PENDING_PAYMENT|PAID|SHIPPING|DELIVERED|CANCELLED") String status,
		@RequestParam(required = false) String q,
		@RequestParam(defaultValue = "0") @Min(0) int page,
		@RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
		return adminOrderService.list(status, q,
			PageRequest.of(page, size, Sort.by(Sort.Order.desc("orderedAt"), Sort.Order.desc("id"))));
	}

	@PatchMapping("/{orderNumber}/status")
	public AdminOrderResponse changeStatus(@CurrentMemberId Long adminId, @PathVariable String orderNumber,
		@Valid @RequestBody StatusRequest request) {
		return adminOrderService.changeStatus(adminId, orderNumber, request.status());
	}

	public record StatusRequest(@NotNull OrderStatus status) {
	}
}
