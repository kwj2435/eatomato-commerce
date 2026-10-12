package com.eatomato.backend.guest;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.cart.CartService;
import com.eatomato.backend.cart.dto.CartResponse;
import com.eatomato.backend.cart.dto.GuestCartLine;
import com.eatomato.backend.order.dto.GuestOrderRequest;
import com.eatomato.backend.order.dto.OrderResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/**
 * 비회원(로그인 없이) 장바구니 금액 계산·주문·조회·취소·결제 승인.
 * 조회·취소·승인은 주문번호 + 주문 비밀번호로 확인하므로 POST 본문으로 받는다(주소·로그에 남지 않게).
 * 클라이언트 IP 는 nginx 가 넘긴 X-Forwarded-For 를 ForwardedHeaderFilter 가 반영한 값이다.
 */
@RestController
@RequestMapping("/api/guest")
@RequiredArgsConstructor
public class GuestController {

	private final CartService cartService;
	private final GuestOrderService guestOrderService;

	/** 브라우저에 보관한 비회원 장바구니의 금액·재고를 서버 기준으로 계산한다. */
	@PostMapping("/cart")
	public CartResponse quoteCart(@Valid @RequestBody CartRequest request) {
		return cartService.quoteGuest(request.items());
	}

	/** 비회원 주문서 제출 → 결제대기 주문. 이어서 /api/guest/orders/confirm 으로 결제를 승인한다. */
	@PostMapping("/orders")
	@ResponseStatus(HttpStatus.CREATED)
	public OrderResponse create(@Valid @RequestBody GuestOrderRequest request) {
		return guestOrderService.create(request);
	}

	@PostMapping("/orders/lookup")
	public OrderResponse lookup(@Valid @RequestBody Credentials request, HttpServletRequest servletRequest) {
		return guestOrderService.get(request.orderNumber(), request.password(), servletRequest.getRemoteAddr());
	}

	/** 고객 취소(결제대기·입금대기·결제완료). 회원 취소와 규칙이 같다. */
	@PostMapping("/orders/cancel")
	public OrderResponse cancel(@Valid @RequestBody Credentials request, HttpServletRequest servletRequest) {
		return guestOrderService.cancel(request.orderNumber(), request.password(), servletRequest.getRemoteAddr());
	}

	/** 결제 승인. PG 결제창이 successUrl 로 넘겨준 값에 주문 비밀번호를 더해 보낸다. */
	@PostMapping("/orders/confirm")
	public OrderResponse confirm(@Valid @RequestBody ConfirmRequest request, HttpServletRequest servletRequest) {
		return guestOrderService.confirmPayment(request.orderNumber(), request.password(), request.paymentKey(),
			request.amount(), servletRequest.getRemoteAddr());
	}

	public record CartRequest(@NotNull @Size(max = 50) @Valid List<GuestCartLine> items) {
	}

	public record Credentials(@NotBlank @Size(max = 30) String orderNumber, @NotBlank @Size(max = 20) String password) {
	}

	public record ConfirmRequest(
		@NotBlank @Size(max = 30) String orderNumber,
		@NotBlank @Size(max = 20) String password,
		@NotBlank @Size(max = 200) String paymentKey,
		@Min(0) int amount) {
	}
}
