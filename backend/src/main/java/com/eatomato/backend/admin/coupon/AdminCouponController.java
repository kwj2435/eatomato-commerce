package com.eatomato.backend.admin.coupon;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
public class AdminCouponController {

	private final AdminCouponService adminCouponService;

	@GetMapping
	public List<AdminCouponService.CouponResponse> list() {
		return adminCouponService.list();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public AdminCouponService.CouponResponse create(@Valid @RequestBody CreateRequest request) {
		return adminCouponService.create(request);
	}

	/** 발급 중지/재개(active), 가입 자동 발급(issueOnSignup). 할인 조건은 이미 받은 회원이 있어 바꾸지 않는다. */
	@PatchMapping("/{id}")
	public AdminCouponService.CouponResponse update(@PathVariable Long id, @RequestBody UpdateRequest request) {
		return adminCouponService.update(id, request);
	}

	@PostMapping("/{id}/issue")
	public AdminCouponService.IssueResult issue(@PathVariable Long id, @Valid @RequestBody IssueRequest request) {
		return adminCouponService.issue(id, request);
	}

	/**
	 * @param discountType FIXED(원) 또는 PERCENT(%)
	 * @param maxDiscount PERCENT 할인 상한(원). 비우면 상한 없음.
	 * @param validDays 발급일부터 며칠. validUntil(종료일) 과 둘 중 하나는 있어야 한다. 둘 다면 이른 쪽.
	 */
	public record CreateRequest(
		@NotBlank @Size(max = 60) String name,
		@NotBlank @Pattern(regexp = "FIXED|PERCENT") String discountType,
		@NotNull @Min(1) @Max(10_000_000) Integer discountValue,
		@Min(1) Integer maxDiscount,
		@Min(0) @Max(100_000_000) Integer minOrderAmount,
		@Min(1) @Max(3650) Integer validDays,
		LocalDate validUntil,
		Boolean issueOnSignup) {
	}

	public record UpdateRequest(Boolean active, Boolean issueOnSignup) {
	}

	/** all 이면 전체 회원, 아니면 loginIds(회원 아이디 목록). */
	public record IssueRequest(Boolean all, @Size(max = 1000) List<String> loginIds) {

		boolean toAll() {
			return Boolean.TRUE.equals(all);
		}
	}
}
