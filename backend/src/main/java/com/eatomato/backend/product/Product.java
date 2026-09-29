package com.eatomato.backend.product;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import org.hibernate.annotations.DynamicUpdate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.eatomato.backend.global.time.Times;

/**
 * DynamicUpdate: 바뀐 컬럼만 UPDATE 한다. 재고는 조건부 UPDATE 쿼리로 차감·복원하므로,
 * 같은 트랜잭션에서 판매량 등을 바꿀 때 메모리에 남은 예전 재고값이 덮어써지지 않게 한다.
 */
@DynamicUpdate
@Entity
@Table(name = "product")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String slug;

	private String name;

	/** 리스트 카드에 노출되는 옵션 요약. 예: "옵션 | 맥세이프" */
	private String optionSummary;

	/** 정상가(원). */
	private int price;

	/** 할인가(원). 없으면 정상가로 판매한다. */
	private Integer salePrice;

	private String imageUrl;

	private String hoverImageUrl;

	private String categoryCode;

	private String subcategoryCode;

	private int salesCount;

	private BigDecimal rating;

	/** 적립금 비율(%). */
	private int rewardRate;

	/** 상품명 아래 배송/제작 안내. 문단은 개행으로 구분한다. */
	private String noticeText;

	private String shippingText;

	/** 재고 수량. null 이면 재고를 관리하지 않는다(무제한). 주문 때 차감, 취소 때 복원한다. */
	private Integer stockQuantity;

	/** false 면 스토어프론트에서 숨긴다(관리자 화면에서는 보인다). */
	private boolean visible;

	/** 소프트 삭제 시각. 주문 내역이 상품을 참조하므로 행을 지우지 않는다. */
	private LocalDateTime deletedAt;

	private LocalDateTime createdAt;

	private LocalDateTime updatedAt;

	@ElementCollection
	@CollectionTable(name = "product_badge", joinColumns = @JoinColumn(name = "product_id"))
	@OrderColumn(name = "sort_order")
	@Column(name = "badge")
	@Enumerated(EnumType.STRING)
	private List<ProductBadge> badges = new ArrayList<>();

	@ElementCollection
	@CollectionTable(name = "product_detail_image", joinColumns = @JoinColumn(name = "product_id"))
	@OrderColumn(name = "sort_order")
	@Column(name = "url")
	private List<String> detailImages = new ArrayList<>();

	@OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("sortOrder")
	private List<ProductOptionGroup> optionGroups = new ArrayList<>();

	/** BETTER TOGETHER(함께 구매) 후보. */
	@ManyToMany
	@JoinTable(
		name = "product_related",
		joinColumns = @JoinColumn(name = "product_id"),
		inverseJoinColumns = @JoinColumn(name = "related_product_id"))
	@OrderColumn(name = "sort_order")
	private List<Product> relatedProducts = new ArrayList<>();

	@Builder
	private Product(String slug, String name, String optionSummary, int price, Integer salePrice,
		String imageUrl, String hoverImageUrl, String categoryCode, String subcategoryCode, int salesCount,
		BigDecimal rating, int rewardRate, String noticeText, String shippingText, List<ProductBadge> badges,
		List<String> detailImages) {
		this.slug = slug;
		this.name = name;
		this.optionSummary = optionSummary;
		this.price = price;
		this.salePrice = salePrice;
		this.imageUrl = imageUrl;
		this.hoverImageUrl = hoverImageUrl;
		this.categoryCode = categoryCode;
		this.subcategoryCode = subcategoryCode;
		this.salesCount = salesCount;
		this.rating = rating;
		this.rewardRate = rewardRate;
		this.noticeText = noticeText;
		this.shippingText = shippingText;
		this.visible = true;
		this.createdAt = Times.now();
		this.updatedAt = this.createdAt;
		if (badges != null) {
			this.badges.addAll(badges);
		}
		if (detailImages != null) {
			this.detailImages.addAll(detailImages);
		}
	}

	/** 재고를 관리하는 상품이고 남은 수량이 0 이하인지. */
	public boolean isSoldOut() {
		return stockQuantity != null && stockQuantity <= 0;
	}

	/** 요청 수량만큼 살 수 있는지(재고 미관리 상품은 항상 가능). */
	public boolean hasStockFor(int quantity) {
		return stockQuantity == null || stockQuantity >= quantity;
	}

	public void changeStock(Integer stockQuantity) {
		this.stockQuantity = stockQuantity;
		this.updatedAt = Times.now();
	}

	public void decreaseSalesCount(int quantity) {
		this.salesCount = Math.max(0, this.salesCount - quantity);
	}

	/** 스토어프론트에 노출·판매 중인지. */
	public boolean isOnSale() {
		return visible && deletedAt == null;
	}

	/** 관리자 수정. 옵션 그룹·함께 구매 상품은 별도 메서드로 바꾼다. */
	public void update(String slug, String name, String optionSummary, int price, Integer salePrice,
		String imageUrl, String hoverImageUrl, String categoryCode, String subcategoryCode, int rewardRate,
		String noticeText, String shippingText, boolean visible, List<ProductBadge> badges, List<String> detailImages) {
		this.slug = slug;
		this.name = name;
		this.optionSummary = optionSummary;
		this.price = price;
		this.salePrice = salePrice;
		this.imageUrl = imageUrl;
		this.hoverImageUrl = hoverImageUrl;
		this.categoryCode = categoryCode;
		this.subcategoryCode = subcategoryCode;
		this.rewardRate = rewardRate;
		this.noticeText = noticeText;
		this.shippingText = shippingText;
		this.visible = visible;
		this.badges.clear();
		this.badges.addAll(badges);
		this.detailImages.clear();
		this.detailImages.addAll(detailImages);
		this.updatedAt = Times.now();
	}

	public void changeVisible(boolean visible) {
		this.visible = visible;
		this.updatedAt = Times.now();
	}

	public void replaceRelatedProducts(List<Product> products) {
		relatedProducts.clear();
		relatedProducts.addAll(products);
	}

	/**
	 * 소프트 삭제. 같은 slug 로 새 상품을 만들 수 있도록 slug 를 비켜 둔다.
	 */
	public void softDelete() {
		this.deletedAt = Times.now();
		this.visible = false;
		this.slug = slug + "--deleted-" + id;
		this.relatedProducts.clear();
		this.updatedAt = this.deletedAt;
	}

	/** 실제 판매가. 할인가가 있으면 할인가. */
	public int currentPrice() {
		return salePrice != null ? salePrice : price;
	}

	public ProductOptionGroup addOptionGroup(String code, String label) {
		ProductOptionGroup group = new ProductOptionGroup(this, code, label, optionGroups.size() + 1);
		optionGroups.add(group);
		return group;
	}

	public void addRelatedProduct(Product product) {
		relatedProducts.add(product);
	}

	public void increaseSalesCount(int quantity) {
		this.salesCount += quantity;
	}

	public List<String> noticeLines() {
		return splitLines(noticeText);
	}

	public List<String> shippingLines() {
		return splitLines(shippingText);
	}

	private static List<String> splitLines(String text) {
		if (text == null || text.isBlank()) {
			return List.of();
		}
		return Arrays.asList(text.split("\n"));
	}
}
