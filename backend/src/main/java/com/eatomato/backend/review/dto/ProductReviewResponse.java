package com.eatomato.backend.review.dto;

import com.eatomato.backend.review.Review;
import com.fasterxml.jackson.annotation.JsonInclude;

/** 상세 페이지 리뷰 한 건. 프론트 `ProductReview` 타입과 같은 형태. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProductReviewResponse(
	String id,
	String writer,
	int rating,
	String content,
	Boolean isBest,
	String imageUrl
) {

	public static ProductReviewResponse from(Review review) {
		return new ProductReviewResponse(
			String.valueOf(review.getId()),
			review.getWriterName(),
			review.getRating(),
			review.getContent(),
			review.isBest() ? Boolean.TRUE : null,
			review.firstImage());
	}
}
