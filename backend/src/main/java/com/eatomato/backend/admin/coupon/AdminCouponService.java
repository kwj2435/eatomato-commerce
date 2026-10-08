package com.eatomato.backend.admin.coupon;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.coupon.Coupon;
import com.eatomato.backend.coupon.CouponRepository;
import com.eatomato.backend.coupon.CouponService;
import com.eatomato.backend.coupon.DiscountType;
import com.eatomato.backend.coupon.MemberCouponRepository;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.member.Member;
import com.eatomato.backend.member.MemberRepository;
import com.eatomato.backend.member.MemberRole;

import lombok.RequiredArgsConstructor;

/** 관리자 쿠폰: 만들기, 발급 중지/재개, 가입 자동 발급 설정, 전체·특정 회원 발급. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminCouponService {

	private final CouponRepository couponRepository;
	private final MemberCouponRepository memberCouponRepository;
	private final MemberRepository memberRepository;
	private final CouponService couponService;

	public List<CouponResponse> list() {
		return couponRepository.findAllByOrderByCreatedAtDescIdDesc().stream().map(this::toResponse).toList();
	}

	@Transactional
	public CouponResponse create(AdminCouponController.CreateRequest request) {
		DiscountType type = DiscountType.valueOf(request.discountType());
		if (type == DiscountType.PERCENT && request.discountValue() > 100) {
			throw new ApiException(ErrorCode.INVALID_REQUEST, "정률 할인은 100% 를 넘을 수 없습니다.");
		}
		if (request.validDays() == null && request.validUntil() == null) {
			throw new ApiException(ErrorCode.INVALID_REQUEST, "사용 기간(발급 후 며칠 또는 종료일)을 정해 주세요.");
		}
		// 종료일은 그날 끝(23:59:59)까지.
		LocalDateTime validUntil = request.validUntil() == null ? null : request.validUntil().atTime(23, 59, 59);
		Coupon coupon = couponRepository.save(new Coupon(request.name().trim(), type, request.discountValue(),
			type == DiscountType.PERCENT ? request.maxDiscount() : null,
			request.minOrderAmount() == null ? 0 : request.minOrderAmount(),
			request.validDays(), validUntil, Boolean.TRUE.equals(request.issueOnSignup())));
		return toResponse(coupon);
	}

	@Transactional
	public CouponResponse update(Long id, AdminCouponController.UpdateRequest request) {
		Coupon coupon = find(id);
		if (request.active() != null) {
			coupon.changeActive(request.active());
		}
		if (request.issueOnSignup() != null) {
			coupon.changeIssueOnSignup(request.issueOnSignup());
		}
		return toResponse(coupon);
	}

	/**
	 * 발급. all 이면 이용 중인 일반 회원 전체, 아니면 loginIds 의 회원. 이미 받은 회원은 건너뛴다.
	 *
	 * @return 새로 발급한 장수와 찾지 못한 아이디
	 */
	@Transactional
	public IssueResult issue(Long id, AdminCouponController.IssueRequest request) {
		Coupon coupon = find(id);
		if (request.toAll()) {
			return new IssueResult(couponService.issue(coupon, memberRepository.findActiveIdsByRole(MemberRole.USER)),
				List.of());
		}
		List<String> loginIds = request.loginIds() == null ? List.of()
			: request.loginIds().stream().map(String::trim).filter(s -> !s.isEmpty()).distinct().toList();
		if (loginIds.isEmpty()) {
			throw new ApiException(ErrorCode.INVALID_REQUEST, "발급할 회원 아이디를 입력해 주세요.");
		}
		List<Member> members = memberRepository.findByLoginIdIn(loginIds);
		Set<String> found = new HashSet<>(members.stream().map(Member::getLoginId).toList());
		int issued = couponService.issue(coupon, members.stream().map(Member::getId).toList());
		return new IssueResult(issued, loginIds.stream().filter(loginId -> !found.contains(loginId)).toList());
	}

	private Coupon find(Long id) {
		return couponRepository.findById(id).orElseThrow(() -> new ApiException(ErrorCode.COUPON_NOT_FOUND));
	}

	private CouponResponse toResponse(Coupon coupon) {
		return new CouponResponse(
			String.valueOf(coupon.getId()),
			coupon.getName(),
			coupon.getDiscountType().name(),
			coupon.getDiscountValue(),
			coupon.getMaxDiscount(),
			coupon.getMinOrderAmount(),
			coupon.getValidDays(),
			coupon.getValidUntil() == null ? null : Times.toOffset(coupon.getValidUntil()),
			coupon.isIssueOnSignup(),
			coupon.isActive(),
			coupon.isIssuable(),
			memberCouponRepository.countByCouponId(coupon.getId()),
			memberCouponRepository.countByCouponIdAndUsedAtIsNotNull(coupon.getId()),
			Times.toOffset(coupon.getCreatedAt()));
	}

	public record CouponResponse(
		String id,
		String name,
		String discountType,
		int discountValue,
		Integer maxDiscount,
		int minOrderAmount,
		Integer validDays,
		OffsetDateTime validUntil,
		boolean issueOnSignup,
		boolean active,
		boolean issuable,
		long issuedCount,
		long usedCount,
		OffsetDateTime createdAt
	) {
	}

	/** notFound: 없는 회원 아이디(발급하지 않음). */
	public record IssueResult(int issued, List<String> notFound) {
	}
}
