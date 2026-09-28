package com.eatomato.backend.cart;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.cart.dto.AddCartItemRequest;
import com.eatomato.backend.cart.dto.CartResponse;
import com.eatomato.backend.cart.dto.SelectAllRequest;
import com.eatomato.backend.cart.dto.UpdateCartItemRequest;
import com.eatomato.backend.global.security.CurrentMemberId;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** 모든 변경 API 는 변경 후의 장바구니 전체를 돌려준다. 프론트는 응답으로 상태를 통째로 교체하면 된다. */
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

	private final CartService cartService;

	@GetMapping
	public CartResponse get(@CurrentMemberId Long memberId) {
		return cartService.get(memberId);
	}

	@PostMapping("/items")
	public CartResponse add(@CurrentMemberId Long memberId, @Valid @RequestBody AddCartItemRequest request) {
		return cartService.add(memberId, request);
	}

	@PatchMapping("/items/{cartItemId}")
	public CartResponse update(@CurrentMemberId Long memberId, @PathVariable Long cartItemId,
		@Valid @RequestBody UpdateCartItemRequest request) {
		return cartService.update(memberId, cartItemId, request);
	}

	/** 전체 선택 / 전체 해제. */
	@PutMapping("/selection")
	public CartResponse selectAll(@CurrentMemberId Long memberId, @Valid @RequestBody SelectAllRequest request) {
		return cartService.selectAll(memberId, request.selected());
	}

	@DeleteMapping("/items/{cartItemId}")
	public CartResponse remove(@CurrentMemberId Long memberId, @PathVariable Long cartItemId) {
		return cartService.remove(memberId, cartItemId);
	}

	@DeleteMapping
	public CartResponse clear(@CurrentMemberId Long memberId) {
		return cartService.clear(memberId);
	}
}
