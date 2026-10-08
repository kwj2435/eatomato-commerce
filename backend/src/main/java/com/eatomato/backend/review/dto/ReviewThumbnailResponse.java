package com.eatomato.backend.review.dto;

import com.eatomato.backend.review.Review;
import com.fasterxml.jackson.annotation.JsonInclude;

/** 메인 대표 리뷰 카드(사진·글·상품). 프론트 `ReviewThumbnail` 타입과 같은 형태. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReviewThumbnailResponse(String id, String imageUrl, String alt, String productSlug, String productName,
	String productImageUrl, int rating, String content) {

	public static ReviewThumbnailResponse from(Review review) {
		return new ReviewThumbnailResponse(
			String.valueOf(review.getId()),
			review.firstImage(),
			review.getProduct().getName() + " 리뷰",
			review.getProduct().getSlug(),
			review.getProduct().getName(),
			review.getProduct().getImageUrl(),
			review.getRating(),
			review.getContent());
	}
}
