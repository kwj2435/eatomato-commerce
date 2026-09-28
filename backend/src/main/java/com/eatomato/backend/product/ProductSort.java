package com.eatomato.backend.product;

import java.util.Arrays;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;

/**
 * 상품 정렬 옵션. 프론트 `SORT_OPTIONS`(lib/utils/product-filter.ts)의 value 와 1:1 대응한다.
 * 가격 정렬은 할인가가 있으면 할인가 기준이다.
 */
public enum ProductSort {

	PRICE_ASC("price-asc", JpaSort.unsafe(Sort.Direction.ASC, "coalesce(p.salePrice, p.price)")),
	PRICE_DESC("price-desc", JpaSort.unsafe(Sort.Direction.DESC, "coalesce(p.salePrice, p.price)")),
	POPULARITY("popularity", Sort.by(Sort.Direction.DESC, "salesCount")),
	RATING("rating", Sort.by(Sort.Direction.DESC, "rating"));

	private final String value;
	private final Sort sort;

	ProductSort(String value, Sort sort) {
		this.value = value;
		this.sort = sort.and(Sort.by("id"));
	}

	public Sort sort() {
		return sort;
	}

	/** 알 수 없는 값은 기본 정렬(판매많은순)로 떨어뜨린다. 프론트 `normalizeSort` 와 같은 규칙. */
	public static ProductSort from(String value) {
		return Arrays.stream(values())
			.filter(sort -> sort.value.equals(value))
			.findFirst()
			.orElse(POPULARITY);
	}
}
