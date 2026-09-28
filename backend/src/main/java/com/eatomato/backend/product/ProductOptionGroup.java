package com.eatomato.backend.product;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 색상/부착타입/기종 같은 옵션 그룹. 그룹마다 선택지 하나를 고른다. */
@Entity
@Table(name = "product_option_group")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductOptionGroup {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "product_id")
	private Product product;

	private String code;

	private String label;

	private int sortOrder;

	@OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("sortOrder")
	private List<ProductOptionChoice> choices = new ArrayList<>();

	ProductOptionGroup(Product product, String code, String label, int sortOrder) {
		this.product = product;
		this.code = code;
		this.label = label;
		this.sortOrder = sortOrder;
	}

	public ProductOptionGroup addChoice(String code, String label, int priceDelta) {
		choices.add(new ProductOptionChoice(this, code, label, priceDelta, choices.size() + 1));
		return this;
	}

	public Optional<ProductOptionChoice> findChoice(String choiceCode) {
		return choices.stream().filter(choice -> choice.getCode().equals(choiceCode)).findFirst();
	}
}
