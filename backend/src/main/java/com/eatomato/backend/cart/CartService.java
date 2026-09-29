package com.eatomato.backend.cart;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.cart.dto.AddCartItemRequest;
import com.eatomato.backend.cart.dto.CartResponse;
import com.eatomato.backend.cart.dto.UpdateCartItemRequest;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.product.Product;
import com.eatomato.backend.product.ProductOptionChoice;
import com.eatomato.backend.product.ProductOptionGroup;
import com.eatomato.backend.product.ProductRepository;
import com.eatomato.backend.shipping.ShippingPolicyService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartService {

	private final CartItemRepository cartItemRepository;
	private final ProductRepository productRepository;
	private final ShippingPolicyService shippingPolicyService;

	public CartResponse get(Long memberId) {
		return CartResponse.from(cartItemRepository.findByMemberIdOrderByCreatedAtAscIdAsc(memberId),
			shippingPolicyService.current());
	}

	@Transactional
	public CartResponse add(Long memberId, AddCartItemRequest request) {
		Product product = productRepository.findById(request.productId())
			.filter(Product::isOnSale)
			.orElseThrow(() -> new ApiException(ErrorCode.PRODUCT_NOT_FOUND));
		SelectedOptions options = resolveOptions(product, request.options() == null ? Map.of() : request.options());
		if (product.isSoldOut()) {
			throw new ApiException(ErrorCode.SOLD_OUT);
		}

		CartItem existing = cartItemRepository.findByMemberIdAndProductAndOptionKey(memberId, product, options.key())
			.orElse(null);
		int wanted = request.quantity() + (existing == null ? 0 : existing.getQuantity());
		requireStock(product, wanted);
		if (existing != null) {
			existing.increaseQuantity(request.quantity());
		} else {
			cartItemRepository.save(new CartItem(memberId, product, options.key(), options.label(),
				options.priceDelta(), request.quantity()));
		}
		return get(memberId);
	}

	@Transactional
	public CartResponse update(Long memberId, Long cartItemId, UpdateCartItemRequest request) {
		CartItem item = cartItemRepository.findByIdAndMemberId(cartItemId, memberId)
			.orElseThrow(() -> new ApiException(ErrorCode.CART_ITEM_NOT_FOUND));
		if (request.quantity() != null) {
			if (request.quantity() > item.getQuantity()) {
				requireStock(item.getProduct(), request.quantity());
			}
			item.changeQuantity(request.quantity());
		}
		if (request.selected() != null) {
			item.changeSelected(request.selected());
		}
		return get(memberId);
	}

	@Transactional
	public CartResponse selectAll(Long memberId, boolean selected) {
		cartItemRepository.findByMemberIdOrderByCreatedAtAscIdAsc(memberId)
			.forEach(item -> item.changeSelected(selected));
		return get(memberId);
	}

	@Transactional
	public CartResponse remove(Long memberId, Long cartItemId) {
		CartItem item = cartItemRepository.findByIdAndMemberId(cartItemId, memberId)
			.orElseThrow(() -> new ApiException(ErrorCode.CART_ITEM_NOT_FOUND));
		cartItemRepository.delete(item);
		return get(memberId);
	}

	@Transactional
	public CartResponse clear(Long memberId) {
		cartItemRepository.deleteByMemberId(memberId);
		return CartResponse.from(List.of(), shippingPolicyService.current());
	}

	/** 담으려는 총수량만큼 재고가 있는지. 부족하면 남은 수량을 알려 준다. */
	private static void requireStock(Product product, int quantity) {
		if (!product.hasStockFor(quantity)) {
			throw new ApiException(ErrorCode.INSUFFICIENT_STOCK,
				"재고가 부족합니다. 지금 살 수 있는 수량은 " + product.getStockQuantity() + "개입니다.");
		}
	}

	/**
	 * 요청 옵션을 상품의 옵션 그룹과 대조한다.
	 * 모든 그룹에서 정확히 하나씩 골라야 하며, 상품에 없는 그룹·선택지는 거절한다.
	 */
	private static SelectedOptions resolveOptions(Product product, Map<String, String> requested) {
		List<ProductOptionGroup> groups = product.getOptionGroups();
		if (requested.size() != groups.size()) {
			throw new ApiException(ErrorCode.INVALID_OPTION);
		}

		List<String> keyParts = new ArrayList<>();
		List<String> labelParts = new ArrayList<>();
		int priceDelta = 0;
		for (ProductOptionGroup group : groups) {
			String choiceCode = requested.get(group.getCode());
			ProductOptionChoice choice = group.findChoice(choiceCode == null ? "" : choiceCode)
				.orElseThrow(() -> new ApiException(ErrorCode.INVALID_OPTION));
			keyParts.add(group.getCode() + "=" + choice.getCode());
			labelParts.add(group.getLabel() + ": " + choice.getLabel());
			priceDelta += choice.getPriceDelta();
		}
		String label = labelParts.isEmpty() ? null : String.join(" / ", labelParts);
		return new SelectedOptions(String.join("&", keyParts), label, priceDelta);
	}

	private record SelectedOptions(String key, String label, int priceDelta) {
	}
}
