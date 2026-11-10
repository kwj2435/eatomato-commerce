package com.eatomato.backend.review.dto;

import java.util.List;

import com.eatomato.backend.review.Review;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 상세 페이지 리뷰 한 건. 프론트 `ProductReview` 타입과 같은 형태.
 * imageUrl 은 첫 사진(목록 썸네일), images 는 첨부한 사진 전체(올린 순서). 사진이 없으면 images 는 빈 배열.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProductReviewResponse(
	String id,
	String writer,
	int rating,
	String content,
	Boolean isBest,
	String imageUrl,
	List<String> images
) {

	public static ProductReviewResponse from(Review review) {
		return new ProductReviewResponse(
			String.valueOf(review.getId()),
			review.getWriterName(),
			review.getRating(),
			review.getContent(),
			review.isBest() ? Boolean.TRUE : null,
			review.firstImage(),
			List.copyOf(review.getImages()));
	}
}
