package com.eatomato.backend.product.dto;

import java.util.ArrayList;
import java.util.List;

import com.eatomato.backend.product.Category;

/**
 * 카테고리 트리. 프론트 `CATEGORY_LIST`(features/product-list/categories.ts)와 같은 형태로,
 * 서브카테고리 첫 항목은 항상 `{ slug: null, label: "All" }` 이다.
 */
public record CategoryResponse(String slug, String label, List<Sub> subcategories) {

	public record Sub(String slug, String label) {
	}

	public static CategoryResponse from(Category category) {
		List<Sub> subs = new ArrayList<>();
		subs.add(new Sub(null, "All"));
		category.getSubcategories().forEach(sub -> subs.add(new Sub(sub.getCode(), sub.getLabel())));
		return new CategoryResponse(category.getCode(), category.getLabel(), subs);
	}
}
