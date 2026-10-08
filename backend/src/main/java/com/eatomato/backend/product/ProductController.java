package com.eatomato.backend.product;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.product.dto.CategoryResponse;
import com.eatomato.backend.product.dto.ProductDetailResponse;
import com.eatomato.backend.product.dto.ProductResponse;
import com.eatomato.backend.review.dto.ProductReviewResponse;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductController {

	private final ProductService productService;

	@GetMapping("/categories")
	public List<CategoryResponse> categories() {
		return productService.listCategories();
	}

	/** 카테고리별 상품 목록. subcategory 를 생략하면 카테고리 전체. */
	@GetMapping("/products")
	public List<ProductResponse> list(
		@RequestParam String category,
		@RequestParam(required = false) String subcategory,
		@RequestParam(required = false) String sort) {
		return productService.list(category, subcategory, ProductSort.from(sort));
	}

	/** 메인 WHAT'S NEW 영역. */
	@GetMapping("/products/new")
	public List<ProductResponse> listNew(@RequestParam(defaultValue = "4") @Min(1) @Max(50) int limit) {
		return productService.listNew(limit);
	}

	/** 메인 Best Picks 오른쪽 상품 칸(BEST 배지 상품). */
	@GetMapping("/products/best")
	public List<ProductResponse> listBest(@RequestParam(defaultValue = "4") @Min(1) @Max(50) int limit) {
		return productService.listBest(limit);
	}

	@GetMapping("/products/search")
	public List<ProductResponse> search(
		@RequestParam(name = "q", required = false) String query,
		@RequestParam(required = false) String sort) {
		return productService.search(query, ProductSort.from(sort));
	}

	/** 정적 빌드(generateStaticParams)용 전체 슬러그. */
	@GetMapping("/products/slugs")
	public List<String> slugs() {
		return productService.listSlugs();
	}

	@GetMapping("/products/{slug}")
	public ProductDetailResponse detail(@PathVariable String slug) {
		return productService.getDetail(slug);
	}

	@GetMapping("/products/{slug}/reviews")
	public Page<ProductReviewResponse> reviews(
		@PathVariable String slug,
		@RequestParam(defaultValue = "0") @Min(0) int page,
		@RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
		return productService.listReviews(slug, PageRequest.of(page, size));
	}
}
