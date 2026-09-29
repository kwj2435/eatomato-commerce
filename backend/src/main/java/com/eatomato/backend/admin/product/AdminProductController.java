package com.eatomato.backend.admin.product;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.admin.common.PageResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

	private final AdminProductService adminProductService;

	@GetMapping
	public PageResponse<AdminProductSummary> list(
		@RequestParam(required = false) String q,
		@RequestParam(required = false) String category,
		@RequestParam(defaultValue = "0") @Min(0) int page,
		@RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
		return adminProductService.list(q, category,
			PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))));
	}

	/** 함께 구매 상품 선택용 전체 목록. */
	@GetMapping("/all")
	public List<AdminProductSummary> all() {
		return adminProductService.listAll();
	}

	@GetMapping("/{id}")
	public AdminProductResponse get(@PathVariable Long id) {
		return adminProductService.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public AdminProductResponse create(@Valid @RequestBody AdminProductRequest request) {
		return adminProductService.create(request);
	}

	@PutMapping("/{id}")
	public AdminProductResponse update(@PathVariable Long id, @Valid @RequestBody AdminProductRequest request) {
		return adminProductService.update(id, request);
	}

	/** 노출/숨김만 바꾼다(목록 화면의 토글). */
	@PatchMapping("/{id}/visible")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void changeVisible(@PathVariable Long id, @Valid @RequestBody VisibleRequest request) {
		adminProductService.changeVisible(id, request.visible());
	}

	/** 재고만 바꾼다(목록 화면의 재고 칸). stockQuantity 를 비우면 재고 관리 해제. */
	@PatchMapping("/{id}/stock")
	public AdminProductSummary changeStock(@PathVariable Long id, @Valid @RequestBody StockRequest request) {
		return adminProductService.changeStock(id, request.stockQuantity());
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable Long id) {
		adminProductService.delete(id);
	}

	public record VisibleRequest(@NotNull Boolean visible) {
	}

	public record StockRequest(@Min(0) @Max(1_000_000) Integer stockQuantity) {
	}
}
