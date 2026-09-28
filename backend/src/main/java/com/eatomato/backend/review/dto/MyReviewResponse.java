package com.eatomato.backend.review.dto;

import java.time.OffsetDateTime;
import java.util.List;

import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.review.Review;

/** 마이페이지 "내가 쓴 글" 한 건. */
public record MyReviewResponse(
	String id,
	String productSlug,
	String productName,
	int rating,
	String content,
	List<String> images,
	OffsetDateTime createdAt
) {

	public static MyReviewResponse from(Review review) {
		return new MyReviewResponse(
			String.valueOf(review.getId()),
			review.getProduct().getSlug(),
			review.getProduct().getName(),
			review.getRating(),
			review.getContent(),
			List.copyOf(review.getImages()),
			Times.toOffset(review.getCreatedAt()));
	}
}
