package com.eatomato.backend.product;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "product_option_choice")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductOptionChoice {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "group_id")
	private ProductOptionGroup group;

	private String code;

	/** 예: "맥세이프 (+4,000원)" */
	private String label;

	/** 기본가에 더할 금액(원). */
	private int priceDelta;

	private int sortOrder;

	ProductOptionChoice(ProductOptionGroup group, String code, String label, int priceDelta, int sortOrder) {
		this.group = group;
		this.code = code;
		this.label = label;
		this.priceDelta = priceDelta;
		this.sortOrder = sortOrder;
	}
}
