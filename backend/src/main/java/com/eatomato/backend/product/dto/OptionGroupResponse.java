package com.eatomato.backend.product.dto;

import java.util.List;

import com.eatomato.backend.product.ProductOptionGroup;

/** 옵션 그룹. id 는 그룹 코드(예: "color"), choices[].id 는 선택지 코드(예: "cream"). */
public record OptionGroupResponse(String id, String label, List<Choice> choices) {

	public record Choice(String id, String label, int priceDelta) {
	}

	public static OptionGroupResponse from(ProductOptionGroup group) {
		return new OptionGroupResponse(
			group.getCode(),
			group.getLabel(),
			group.getChoices().stream()
				.map(choice -> new Choice(choice.getCode(), choice.getLabel(), choice.getPriceDelta()))
				.toList());
	}

	public static List<OptionGroupResponse> listOf(List<ProductOptionGroup> groups) {
		return groups.stream().map(OptionGroupResponse::from).toList();
	}
}
