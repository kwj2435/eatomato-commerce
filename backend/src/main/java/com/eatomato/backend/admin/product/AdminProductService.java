package com.eatomato.backend.admin.product;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.admin.common.Keywords;
import com.eatomato.backend.admin.common.PageResponse;
import com.eatomato.backend.cart.CartItemRepository;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.product.Category;
import com.eatomato.backend.product.CategoryRepository;
import com.eatomato.backend.product.Product;
import com.eatomato.backend.product.ProductBadge;
import com.eatomato.backend.product.ProductOptionGroup;
import com.eatomato.backend.product.ProductRepository;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminProductService {

	private final ProductRepository productRepository;
	private final CategoryRepository categoryRepository;
	private final CartItemRepository cartItemRepository;
	private final EntityManager entityManager;

	public PageResponse<AdminProductSummary> list(String keyword, String category, Pageable pageable) {
		return PageResponse.of(
			productRepository.searchForAdmin(Keywords.normalize(keyword), Keywords.normalize(category), pageable),
			AdminProductSummary::from);
	}

	/** 함께 구매 상품 선택용 전체 목록(삭제 제외). */
	public List<AdminProductSummary> listAll() {
		return productRepository.findAllForAdmin().stream().map(AdminProductSummary::from).toList();
	}

	public AdminProductResponse get(Long id) {
		return AdminProductResponse.from(find(id));
	}

	@Transactional
	public AdminProductResponse create(AdminProductRequest request) {
		validate(request, null);
		Product product = productRepository.save(Product.builder()
			.slug(request.slug())
			.name(request.name().trim())
			.optionSummary(blankToNull(request.optionSummary()))
			.price(request.price())
			.salePrice(request.salePrice())
			.imageUrl(blankToNull(request.imageUrl()))
			.hoverImageUrl(blankToNull(request.hoverImageUrl()))
			.categoryCode(request.categoryCode())
			.subcategoryCode(blankToNull(request.subcategoryCode()))
			.salesCount(0)
			.rating(BigDecimal.ZERO)
			.rewardRate(request.rewardRate())
			.noticeText(blankToNull(request.noticeText()))
			.shippingText(blankToNull(request.shippingText()))
			.badges(badges(request))
			.detailImages(listOrEmpty(request.detailImages()))
			.build());
		product.changeVisible(request.visible());
		product.changeStock(request.stockQuantity());
		addOptionGroups(product, request);
		product.replaceRelatedProducts(relatedProducts(request, product.getId()));
		return AdminProductResponse.from(product);
	}

	@Transactional
	public AdminProductResponse update(Long id, AdminProductRequest request) {
		Product product = find(id);
		validate(request, id);
		product.update(
			request.slug(),
			request.name().trim(),
			blankToNull(request.optionSummary()),
			request.price(),
			request.salePrice(),
			blankToNull(request.imageUrl()),
			blankToNull(request.hoverImageUrl()),
			request.categoryCode(),
			blankToNull(request.subcategoryCode()),
			request.rewardRate(),
			blankToNull(request.noticeText()),
			blankToNull(request.shippingText()),
			request.visible(),
			badges(request),
			listOrEmpty(request.detailImages()));
		product.changeStock(request.stockQuantity());

		// 옵션 그룹은 통째로 교체한다. (product_id, code) 유니크 제약 때문에
		// 기존 행 삭제를 먼저 DB 에 반영(flush)한 뒤 새 그룹을 넣는다.
		product.getOptionGroups().clear();
		entityManager.flush();
		addOptionGroups(product, request);

		product.replaceRelatedProducts(relatedProducts(request, id));
		return AdminProductResponse.from(product);
	}

	@Transactional
	public void changeVisible(Long id, boolean visible) {
		find(id).changeVisible(visible);
	}

	/** 목록 화면에서 재고만 바꾼다. null 이면 재고 관리 해제. */
	@Transactional
	public AdminProductSummary changeStock(Long id, Integer stockQuantity) {
		Product product = find(id);
		product.changeStock(stockQuantity);
		return AdminProductSummary.from(product);
	}

	/** 선택한 상품들의 할인율을 한 번에 바꾼다. rate=0 이면 할인 해제. 하나라도 없는 상품이면 아무것도 바꾸지 않는다. */
	@Transactional
	public List<AdminProductSummary> applyDiscountRate(List<Long> productIds, int rate, int roundingUnit) {
		List<Long> ids = productIds.stream().distinct().toList();
		List<Product> products = productRepository.findAllById(ids).stream()
			.filter(product -> product.getDeletedAt() == null)
			.toList();
		if (products.size() != ids.size()) {
			throw new ApiException(ErrorCode.PRODUCT_NOT_FOUND);
		}
		products.forEach(product -> product.applyDiscountRate(rate, roundingUnit));
		return products.stream().map(AdminProductSummary::from).toList();
	}

	/**
	 * 삭제. 주문 내역이 상품을 참조하므로 소프트 삭제하고,
	 * 장바구니와 다른 상품의 함께 구매 목록에서는 바로 뺀다.
	 */
	@Transactional
	public void delete(Long id) {
		Product product = find(id);
		cartItemRepository.deleteByProduct(product);
		productRepository.deleteRelationsTo(id);
		product.softDelete();
	}

	private Product find(Long id) {
		return productRepository.findByIdAndDeletedAtIsNull(id)
			.orElseThrow(() -> new ApiException(ErrorCode.PRODUCT_NOT_FOUND));
	}

	private void validate(AdminProductRequest request, Long selfId) {
		boolean duplicate = selfId == null
			? productRepository.existsBySlug(request.slug())
			: productRepository.existsBySlugAndIdNot(request.slug(), selfId);
		if (duplicate) {
			throw new ApiException(ErrorCode.DUPLICATE_SLUG);
		}

		Category category = categoryRepository.findById(request.categoryCode())
			.orElseThrow(() -> new ApiException(ErrorCode.INVALID_CATEGORY));
		String subcategory = blankToNull(request.subcategoryCode());
		if (subcategory != null && !category.hasSubcategory(subcategory)) {
			throw new ApiException(ErrorCode.INVALID_CATEGORY);
		}

		if (request.salePrice() != null && request.salePrice() >= request.price()) {
			throw new ApiException(ErrorCode.INVALID_PRODUCT);
		}

		// 옵션 그룹 코드·그룹 안 선택지 코드는 겹치면 안 된다(장바구니 옵션 키로 쓰인다).
		Set<String> groupCodes = new HashSet<>();
		for (AdminProductRequest.OptionGroup group : listOrEmpty(request.optionGroups())) {
			if (!groupCodes.add(group.code())) {
				throw new ApiException(ErrorCode.INVALID_PRODUCT);
			}
			Set<String> choiceCodes = new HashSet<>();
			for (AdminProductRequest.Choice choice : group.choices()) {
				if (!choiceCodes.add(choice.code())) {
					throw new ApiException(ErrorCode.INVALID_PRODUCT);
				}
			}
		}
	}

	private static void addOptionGroups(Product product, AdminProductRequest request) {
		for (AdminProductRequest.OptionGroup group : listOrEmpty(request.optionGroups())) {
			ProductOptionGroup added = product.addOptionGroup(group.code(), group.label().trim());
			group.choices().forEach(choice -> added.addChoice(choice.code(), choice.label().trim(), choice.priceDelta()));
		}
	}

	private List<Product> relatedProducts(AdminProductRequest request, Long selfId) {
		return listOrEmpty(request.relatedProductIds()).stream()
			.distinct()
			.filter(relatedId -> !relatedId.equals(selfId))
			.map(relatedId -> productRepository.findByIdAndDeletedAtIsNull(relatedId)
				.orElseThrow(() -> new ApiException(ErrorCode.PRODUCT_NOT_FOUND)))
			.toList();
	}

	private static List<ProductBadge> badges(AdminProductRequest request) {
		return listOrEmpty(request.badges()).stream().distinct().map(ProductBadge::valueOf).toList();
	}

	private static <T> List<T> listOrEmpty(List<T> list) {
		return list == null ? List.of() : list;
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}
}
