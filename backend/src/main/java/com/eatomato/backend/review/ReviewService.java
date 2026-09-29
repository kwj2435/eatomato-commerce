package com.eatomato.backend.review;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.member.Member;
import com.eatomato.backend.member.MemberRepository;
import com.eatomato.backend.order.OrderItem;
import com.eatomato.backend.order.OrderItemRepository;
import com.eatomato.backend.product.Product;
import com.eatomato.backend.product.ProductRepository;
import com.eatomato.backend.review.dto.MyReviewResponse;
import com.eatomato.backend.review.dto.ReviewThumbnailResponse;
import com.eatomato.backend.review.dto.ReviewableProductResponse;
import com.eatomato.backend.upload.FileStorage;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

	/** 프론트 ReviewWriteForm 의 MAX_PHOTOS 와 같다. */
	public static final int MAX_PHOTOS = 5;

	private final ReviewRepository reviewRepository;
	private final OrderItemRepository orderItemRepository;
	private final ProductRepository productRepository;
	private final MemberRepository memberRepository;
	private final FileStorage fileStorage;

	public List<ReviewThumbnailResponse> listFeatured(int limit) {
		return reviewRepository.findByFeaturedTrueOrderByCreatedAtDescIdDesc(PageRequest.of(0, limit)).stream()
			.map(ReviewThumbnailResponse::from)
			.toList();
	}

	public List<ReviewableProductResponse> listReviewable(Long memberId) {
		return orderItemRepository.findReviewable(memberId).stream()
			.map(ReviewableProductResponse::from)
			.toList();
	}

	public List<MyReviewResponse> listMine(Long memberId) {
		return reviewRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream()
			.map(MyReviewResponse::from)
			.toList();
	}

	@Transactional
	public MyReviewResponse create(Long memberId, Long orderItemId, int rating, String content,
		List<MultipartFile> photos) {
		List<MultipartFile> files = photos == null ? List.of() : photos.stream().filter(f -> !f.isEmpty()).toList();
		if (files.size() > MAX_PHOTOS) {
			throw new ApiException(ErrorCode.TOO_MANY_PHOTOS);
		}

		OrderItem orderItem = orderItemRepository.findByIdAndOrderMemberId(orderItemId, memberId)
			.orElseThrow(() -> new ApiException(ErrorCode.ORDER_ITEM_NOT_REVIEWABLE));
		if (orderItem.isReviewed()) {
			throw new ApiException(ErrorCode.REVIEW_ALREADY_WRITTEN);
		}
		Member member = memberRepository.findById(memberId)
			.orElseThrow(() -> new ApiException(ErrorCode.MEMBER_NOT_FOUND));
		Product product = productRepository.findById(orderItem.getProductId())
			.orElseThrow(() -> new ApiException(ErrorCode.PRODUCT_NOT_FOUND));

		List<String> imageUrls = files.stream().map(file -> fileStorage.storeImage("reviews", file)).toList();

		Review review = reviewRepository.save(Review.builder()
			.product(product)
			.memberId(memberId)
			.orderItemId(orderItemId)
			// 닉네임이 있으면 닉네임(공개용으로 받은 값), 없으면 이름 첫 글자만 남긴다.
			.writerName(member.getNickname() != null ? member.getNickname() : Review.maskName(member.getName()))
			.rating(rating)
			.content(content.trim())
			.images(imageUrls)
			.build());
		orderItem.markReviewed();
		return MyReviewResponse.from(review);
	}
}
