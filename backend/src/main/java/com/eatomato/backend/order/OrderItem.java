package com.eatomato.backend.order;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.eatomato.backend.cart.CartItem;

/** 주문 시점의 상품명·옵션·단가 스냅샷. 이후 상품 정보가 바뀌어도 주문 내역은 그대로다. */
@Entity
@Table(name = "order_item")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "order_id")
	private Order order;

	private Long productId;

	private String productSlug;

	private String productName;

	private String optionLabel;

	private int unitPrice;

	private int quantity;

	private String imageUrl;

	private boolean reviewed;

	public static OrderItem snapshotOf(CartItem cartItem) {
		OrderItem item = new OrderItem();
		item.productId = cartItem.getProduct().getId();
		item.productSlug = cartItem.getProduct().getSlug();
		item.productName = cartItem.getProduct().getName();
		item.optionLabel = cartItem.getOptionLabel();
		item.unitPrice = cartItem.unitPrice();
		item.quantity = cartItem.getQuantity();
		item.imageUrl = cartItem.getProduct().getImageUrl();
		return item;
	}

	void assignTo(Order order) {
		this.order = order;
	}

	public int lineTotal() {
		return unitPrice * quantity;
	}

	public void markReviewed() {
		this.reviewed = true;
	}
}
