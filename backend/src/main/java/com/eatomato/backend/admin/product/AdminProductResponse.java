package com.eatomato.backend.admin.product;

import java.time.OffsetDateTime;
import java.util.List;

import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.product.Product;
import com.eatomato.backend.product.ProductOptionGroup;

/** 관리자 상품 상세(수정 폼 초기값). */
public record AdminProductResponse(
	String id,
	String slug,
	String name,
	String optionSummary,
	int price,
	Integer salePrice,
	String imageUrl,
	String hoverImageUrl,
	String categoryCode,
	String subcategoryCode,
	int rewardRate,
	Integer stockQuantity,
	String noticeText,
	String shippingText,
	boolean visible,
	List<String> badges,
	List<String> detailImages,
	List<OptionGroup> optionGroups,
	List<String> relatedProductIds,
	int salesCount,
	double rating,
	OffsetDateTime createdAt,
	OffsetDateTime updatedAt
) {

	public record OptionGroup(String code, String label, List<Choice> choices) {

		static OptionGroup from(ProductOptionGroup group) {
			return new OptionGroup(group.getCode(), group.getLabel(), group.getChoices().stream()
				.map(choice -> new Choice(choice.getCode(), choice.getLabel(), choice.getPriceDelta()))
				.toList());
		}
	}

	public record Choice(String code, String label, int priceDelta) {
	}

	public static AdminProductResponse from(Product product) {
		return new AdminProductResponse(
			String.valueOf(product.getId()),
			product.getSlug(),
			product.getName(),
			product.getOptionSummary(),
			product.getPrice(),
			product.getSalePrice(),
			product.getImageUrl(),
			product.getHoverImageUrl(),
			product.getCategoryCode(),
			product.getSubcategoryCode(),
			product.getRewardRate(),
			product.getStockQuantity(),
			product.getNoticeText(),
			product.getShippingText(),
			product.isVisible(),
			product.getBadges().stream().map(Enum::name).toList(),
			List.copyOf(product.getDetailImages()),
			product.getOptionGroups().stream().map(OptionGroup::from).toList(),
			product.getRelatedProducts().stream().map(related -> String.valueOf(related.getId())).toList(),
			product.getSalesCount(),
			product.getRating().doubleValue(),
			Times.toOffset(product.getCreatedAt()),
			product.getUpdatedAt() == null ? null : Times.toOffset(product.getUpdatedAt()));
	}
}
