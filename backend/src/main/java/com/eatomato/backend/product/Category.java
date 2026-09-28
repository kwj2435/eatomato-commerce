package com.eatomato.backend.product;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 최상위 카테고리. code 가 URL 세그먼트(`/products/{code}`)와 같다. */
@Entity
@Table(name = "category")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Category {

	@Id
	private String code;

	private String label;

	private int sortOrder;

	@OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
	@OrderBy("sortOrder")
	private List<Subcategory> subcategories = new ArrayList<>();

	public Category(String code, String label, int sortOrder) {
		this.code = code;
		this.label = label;
		this.sortOrder = sortOrder;
	}

	public Category addSubcategory(String code, String label) {
		subcategories.add(new Subcategory(code, this, label, subcategories.size() + 1));
		return this;
	}

	public boolean hasSubcategory(String subcategoryCode) {
		return subcategories.stream().anyMatch(sub -> sub.getCode().equals(subcategoryCode));
	}
}
