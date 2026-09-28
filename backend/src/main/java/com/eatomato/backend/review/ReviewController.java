package com.eatomato.backend.review;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.eatomato.backend.global.security.CurrentMemberId;
import com.eatomato.backend.review.dto.MyReviewResponse;
import com.eatomato.backend.review.dto.ReviewThumbnailResponse;
import com.eatomato.backend.review.dto.ReviewableProductResponse;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {

	private final ReviewService reviewService;

	/** 메인 화면 대표 리뷰 썸네일. */
	@GetMapping("/reviews/featured")
	public List<ReviewThumbnailResponse> featured(@RequestParam(defaultValue = "4") @Min(1) @Max(20) int limit) {
		return reviewService.listFeatured(limit);
	}

	/** 후기 쓰기 페이지의 "상품 선택" 목록: 구매했지만 아직 후기를 쓰지 않은 주문 상품. */
	@GetMapping("/me/reviewable-products")
	public List<ReviewableProductResponse> reviewable(@CurrentMemberId Long memberId) {
		return reviewService.listReviewable(memberId);
	}

	@GetMapping("/me/reviews")
	public List<MyReviewResponse> mine(@CurrentMemberId Long memberId) {
		return reviewService.listMine(memberId);
	}

	/** 후기 저장. 사진은 `photos` 파트로 최대 5장까지 받는다. */
	@PostMapping(path = "/reviews", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseStatus(HttpStatus.CREATED)
	public MyReviewResponse create(
		@CurrentMemberId Long memberId,
		@RequestParam Long orderItemId,
		@RequestParam @Min(1) @Max(5) int rating,
		@RequestParam @NotBlank @Size(max = 2000) String content,
		@RequestPart(name = "photos", required = false) List<MultipartFile> photos) {
		return reviewService.create(memberId, orderItemId, rating, content, photos);
	}
}
