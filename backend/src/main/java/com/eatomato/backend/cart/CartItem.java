package com.eatomato.backend.cart;

import java.time.LocalDateTime;

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

import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.product.Product;

@Entity
@Table(name = "cart_item")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CartItem {

	public static final int MAX_QUANTITY = 99;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long memberId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "product_id")
	private Product product;

	/** 옵션 조합 식별자. 같은 상품·같은 옵션 조합은 한 줄로 합친다. */
	private String optionKey;

	/** 화면 표시용 옵션 문구. 예: "색상: 크림 / 부착타입: 맥세이프 (+4,000원)" */
	private String optionLabel;

	/** 선택 옵션 추가금 합계. 단가 = 상품 판매가 + 이 값. */
	private int optionPriceDelta;

	private int quantity;

	private boolean selected;

	private LocalDateTime createdAt;

	public CartItem(Long memberId, Product product, String optionKey, String optionLabel, int optionPriceDelta,
		int quantity) {
		this.memberId = memberId;
		this.product = product;
		this.optionKey = optionKey;
		this.optionLabel = optionLabel;
		this.optionPriceDelta = optionPriceDelta;
		this.quantity = clamp(quantity);
		this.selected = true;
		this.createdAt = Times.now();
	}

	public int unitPrice() {
		return product.currentPrice() + optionPriceDelta;
	}

	public int lineTotal() {
		return unitPrice() * quantity;
	}

	public void increaseQuantity(int amount) {
		this.quantity = clamp(this.quantity + amount);
	}

	public void changeQuantity(int quantity) {
		this.quantity = clamp(quantity);
	}

	public void changeSelected(boolean selected) {
		this.selected = selected;
	}

	private static int clamp(int quantity) {
		return Math.clamp(quantity, 1, MAX_QUANTITY);
	}
}
