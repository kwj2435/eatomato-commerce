package com.eatomato.backend.product.dto;

import java.util.List;

import com.eatomato.backend.product.Product;
import com.eatomato.backend.review.dto.ProductReviewResponse;
import com.fasterxml.jackson.annotation.JsonInclude;

/** 상품 상세. 프론트 `ProductDetail` 타입(src/types/product-detail.ts)과 같은 형태. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProductDetailResponse(
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
	Integer stock,
	boolean soldOut,
	List<String> noticeLines,
	int rewardRate,
	List<String> shippingLines,
	List<OptionGroupResponse> optionGroups,
	List<BetterTogetherResponse> betterTogether,
	List<String> detailImages,
	List<ProductReviewResponse> reviews,
	long reviewCount
) {

	public static ProductDetailResponse of(Product product, List<ProductReviewResponse> reviews, long reviewCount) {
		ProductResponse base = ProductResponse.from(product);
		return new ProductDetailResponse(
			base.id(),
			base.name(),
			base.option(),
			base.price(),
			base.salePrice(),
			base.imageUrl(),
			base.hoverImageUrl(),
			base.slug(),
			base.badges(),
			base.category(),
			base.subcategory(),
			base.salesCount(),
			base.rating(),
			base.stock(),
			base.soldOut(),
			product.noticeLines(),
			product.getRewardRate(),
			product.shippingLines(),
			OptionGroupResponse.listOf(product.getOptionGroups()),
			product.getRelatedProducts().stream()
				.filter(Product::isOnSale)
				.map(BetterTogetherResponse::from)
				.toList(),
			List.copyOf(product.getDetailImages()),
			reviews,
			reviewCount);
	}
}
