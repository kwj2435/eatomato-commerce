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
import com.eatomato.backend.payment.PaymentGateway;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
		@RequestParam(required = false) @Pattern(regexp = "PENDING_PAYMENT|AWAITING_DEPOSIT|PAID|SHIPPING|DELIVERED|CANCELLED") String status,
		@RequestParam(required = false) String q,
		@RequestParam(defaultValue = "0") @Min(0) int page,
		@RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
		return adminOrderService.list(status, q,
			PageRequest.of(page, size, Sort.by(Sort.Order.desc("orderedAt"), Sort.Order.desc("id"))));
	}

	@PatchMapping("/{orderNumber}/status")
	public AdminOrderResponse changeStatus(@CurrentMemberId Long adminId, @PathVariable String orderNumber,
		@Valid @RequestBody StatusRequest request) {
		RefundAccountRequest refund = request.refundAccount();
		return adminOrderService.changeStatus(adminId, orderNumber, request.status(), refund == null ? null
			: new PaymentGateway.RefundAccount(refund.bank(), refund.accountNumber(), refund.holderName().trim()));
	}

	/** refundAccount: 무통장입금으로 입금까지 끝난 주문을 취소할 때만. 고객이 알려 준 환불 계좌. */
	public record StatusRequest(@NotNull OrderStatus status, @Valid RefundAccountRequest refundAccount) {
	}

	/** bank 는 토스 은행 코드(숫자 2자리), accountNumber 는 숫자만. */
	public record RefundAccountRequest(
		@NotBlank @Pattern(regexp = "\\d{2}") String bank,
		@NotBlank @Pattern(regexp = "\\d{6,20}") String accountNumber,
		@NotBlank @Size(max = 60) String holderName) {
	}
}
