package com.eatomato.backend.admin.product;

import java.time.OffsetDateTime;
import java.util.List;

import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.product.Product;

/** 관리자 상품 목록 한 줄. */
public record AdminProductSummary(
	String id,
	String slug,
	String name,
	String categoryCode,
	String subcategoryCode,
	int price,
	Integer salePrice,
	String imageUrl,
	boolean visible,
	Integer stockQuantity,
	boolean soldOut,
	List<String> badges,
	int salesCount,
	double rating,
	OffsetDateTime createdAt
) {

	public static AdminProductSummary from(Product product) {
		return new AdminProductSummary(
			String.valueOf(product.getId()),
			product.getSlug(),
			product.getName(),
			product.getCategoryCode(),
			product.getSubcategoryCode(),
			product.getPrice(),
			product.getSalePrice(),
			product.getImageUrl(),
			product.isVisible(),
			product.getStockQuantity(),
			product.isSoldOut(),
			product.getBadges().stream().map(Enum::name).toList(),
			product.getSalesCount(),
			product.getRating().doubleValue(),
			Times.toOffset(product.getCreatedAt()));
	}
}
