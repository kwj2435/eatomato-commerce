package com.eatomato.backend.product.dto;

import java.util.List;

import com.eatomato.backend.product.Product;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record BetterTogetherResponse(
	String id,
	String slug,
	String name,
	int price,
	Integer salePrice,
	String imageUrl,
	boolean soldOut,
	List<OptionGroupResponse> optionGroups
) {

	public static BetterTogetherResponse from(Product product) {
		return new BetterTogetherResponse(
			String.valueOf(product.getId()),
			product.getSlug(),
			product.getName(),
			product.getPrice(),
			product.getSalePrice(),
			product.getImageUrl(),
			product.isSoldOut(),
			OptionGroupResponse.listOf(product.getOptionGroups()));
	}
}
