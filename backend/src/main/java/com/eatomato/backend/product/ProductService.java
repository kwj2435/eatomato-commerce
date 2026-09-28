package com.eatomato.backend.product;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.product.dto.CategoryResponse;
import com.eatomato.backend.product.dto.ProductDetailResponse;
import com.eatomato.backend.product.dto.ProductResponse;
import com.eatomato.backend.review.ReviewRepository;
import com.eatomato.backend.review.dto.ProductReviewResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

	/** 상세 응답에 같이 싣는 리뷰 수. 나머지는 `/api/products/{slug}/reviews` 로 페이지 조회한다. */
	private static final int DETAIL_REVIEW_LIMIT = 10;

	private final ProductRepository productRepository;
	private final CategoryRepository categoryRepository;
	private final ReviewRepository reviewRepository;

	public List<CategoryResponse> listCategories() {
		return categoryRepository.findAllByOrderBySortOrder().stream().map(CategoryResponse::from).toList();
	}

	public List<ProductResponse> listNew(int limit) {
		return productRepository.findByBadge(ProductBadge.NEW, PageRequest.of(0, limit)).stream()
			.map(ProductResponse::from)
			.toList();
	}

	public List<ProductResponse> list(String categoryCode, String subcategoryCode, ProductSort sort) {
		Category category = categoryRepository.findById(categoryCode)
			.orElseThrow(() -> new ApiException(ErrorCode.INVALID_CATEGORY));
		if (subcategoryCode != null && !category.hasSubcategory(subcategoryCode)) {
			throw new ApiException(ErrorCode.INVALID_CATEGORY);
		}
		return productRepository.findByCategory(categoryCode, subcategoryCode, sort.sort()).stream()
			.map(ProductResponse::from)
			.toList();
	}

	public List<ProductResponse> search(String query, ProductSort sort) {
		String keyword = query == null ? "" : query.trim();
		if (keyword.isEmpty()) {
			return List.of();
		}
		return productRepository.search(escapeLike(keyword), sort.sort()).stream()
			.map(ProductResponse::from)
			.toList();
	}

	public List<String> listSlugs() {
		return productRepository.findAllSlugs();
	}

	public ProductDetailResponse getDetail(String slug) {
		Product product = findBySlug(slug);
		List<ProductReviewResponse> reviews = reviewRepository
			.findByProductOrderByBestDescCreatedAtDesc(product, PageRequest.of(0, DETAIL_REVIEW_LIMIT)).stream()
			.map(ProductReviewResponse::from)
			.toList();
		long reviewCount = reviewRepository.countByProduct(product);
		return ProductDetailResponse.of(product, reviews, reviewCount);
	}

	public Page<ProductReviewResponse> listReviews(String slug, Pageable pageable) {
		Product product = findBySlug(slug);
		return reviewRepository.findByProductOrderByBestDescCreatedAtDesc(product, pageable)
			.map(ProductReviewResponse::from);
	}

	private Product findBySlug(String slug) {
		return productRepository.findOnSaleBySlug(slug)
			.orElseThrow(() -> new ApiException(ErrorCode.PRODUCT_NOT_FOUND));
	}

	private static String escapeLike(String keyword) {
		return keyword.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
	}
}
