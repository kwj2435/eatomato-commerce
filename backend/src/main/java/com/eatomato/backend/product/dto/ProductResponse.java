package com.eatomato.backend.product.dto;

import java.util.List;

import com.eatomato.backend.product.Product;
import com.fasterxml.jackson.annotation.JsonInclude;

/** 리스트용 상품. 프론트 `Product` 타입(src/types/product.ts)과 같은 형태. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProductResponse(
	String id,
	String name,
	String option,
	int price,
	Integer salePrice,
	String imageUrl,
	String hoverImageUrl,
	String slug,
	List<String> badges,
	String category,
	String subcategory,
	int salesCount,
	double rating,
	/** 남은 재고. 재고를 관리하지 않는 상품은 null(응답에서 빠진다). */
	Integer stock,
	boolean soldOut
) {

	public static ProductResponse from(Product product) {
		return new ProductResponse(
			String.valueOf(product.getId()),
			product.getName(),
			product.getOptionSummary(),
			product.getPrice(),
			product.getSalePrice(),
			product.getImageUrl(),
			product.getHoverImageUrl(),
			product.getSlug(),
			product.getBadges().isEmpty() ? null : product.getBadges().stream().map(Enum::name).toList(),
			product.getCategoryCode(),
			product.getSubcategoryCode(),
			product.getSalesCount(),
			product.getRating().doubleValue(),
			product.getStockQuantity(),
			product.isSoldOut());
	}
}
