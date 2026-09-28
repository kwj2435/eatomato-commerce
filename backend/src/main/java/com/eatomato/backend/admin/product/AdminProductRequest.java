package com.eatomato.backend.admin.product;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** 상품 등록·수정. 수정은 전체 교체(PUT)다. */
public record AdminProductRequest(
	@NotBlank @Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*", message = "영문 소문자·숫자·하이픈만 쓸 수 있습니다.")
	@Size(max = 80) String slug,
	@NotBlank @Size(max = 200) String name,
	@Size(max = 100) String optionSummary,
	@Min(0) @Max(100_000_000) int price,
	@Min(0) @Max(100_000_000) Integer salePrice,
	@Size(max = 500) String imageUrl,
	@Size(max = 500) String hoverImageUrl,
	@NotBlank String categoryCode,
	String subcategoryCode,
	@Min(0) @Max(100) int rewardRate,
	String noticeText,
	String shippingText,
	boolean visible,
	List<@Pattern(regexp = "NEW|BEST|SALE") String> badges,
	@Size(max = 20) List<@NotBlank @Size(max = 500) String> detailImages,
	@Size(max = 10) List<@Valid OptionGroup> optionGroups,
	@Size(max = 6) List<@NotNull Long> relatedProductIds
) {

	public record OptionGroup(
		@NotBlank @Pattern(regexp = "[a-z0-9-]{1,40}", message = "영문 소문자·숫자·하이픈 1~40자") String code,
		@NotBlank @Size(max = 60) String label,
		@Size(min = 1, max = 30) List<@Valid Choice> choices) {
	}

	public record Choice(
		@NotBlank @Pattern(regexp = "[a-z0-9-]{1,40}", message = "영문 소문자·숫자·하이픈 1~40자") String code,
		@NotBlank @Size(max = 100) String label,
		@Min(-100_000_000) @Max(100_000_000) int priceDelta) {
	}
}
