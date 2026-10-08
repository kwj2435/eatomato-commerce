package com.eatomato.backend.coupon;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.global.time.Times;

import lombok.RequiredArgsConstructor;

/**
 * 쿠폰 발급·조회·주문 적용. 주문당 쿠폰 1장, 할인은 상품 금액(배송비 제외)에만.
 * 주문을 만들 때 사용 처리하고, 주문이 취소되면 다시 쓸 수 있게 돌려준다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CouponService {

	private final CouponRepository couponRepository;
	private final MemberCouponRepository memberCouponRepository;

	/** 신규 가입 쿠폰(가입 시 자동 발급으로 표시된 활성 쿠폰)을 준다. */
	@Transactional
	public void issueSignupCoupons(Long memberId) {
		couponRepository.findByIssueOnSignupTrueAndActiveTrue().stream()
			.filter(Coupon::isIssuable)
			.forEach(coupon -> issue(coupon, List.of(memberId)));
	}

	/**
	 * 회원들에게 발급한다. 같은 쿠폰을 이미 받은 회원은 건너뛴다.
	 *
	 * @return 새로 발급한 장수
	 */
	@Transactional
	public int issue(Coupon coupon, Collection<Long> memberIds) {
		if (!coupon.isIssuable()) {
			throw new ApiException(ErrorCode.COUPON_NOT_ISSUABLE);
		}
		if (memberIds.isEmpty()) {
			return 0;
		}
		Set<Long> holders = new HashSet<>(memberCouponRepository.findHolders(coupon.getId(), memberIds));
		LocalDateTime now = Times.now();
		List<MemberCoupon> issued = memberIds.stream()
			.distinct()
			.filter(memberId -> !holders.contains(memberId))
			.map(memberId -> new MemberCoupon(memberId, coupon, now))
			.toList();
		memberCouponRepository.saveAll(issued);
		return issued.size();
	}

	/** 내 쿠폰(사용 가능 → 사용함·기한 지남 순으로 쓰기 좋게 프론트가 나눈다). */
	public List<MemberCouponResponse> mine(Long memberId) {
		LocalDateTime now = Times.now();
		return memberCouponRepository.findMine(memberId).stream()
			.map(mc -> MemberCouponResponse.from(mc, now))
			.toList();
	}

	/**
	 * 주문서에서 고른 쿠폰의 할인액. 내 쿠폰인지, 안 썼는지, 기한 안인지, 최소 주문 금액을 넘는지 확인한다.
	 *
	 * @throws ApiException COUPON_NOT_FOUND, COUPON_NOT_APPLICABLE
	 */
	public int discountFor(Long memberId, Long memberCouponId, int subtotal) {
		MemberCoupon memberCoupon = memberCouponRepository.findMine(memberCouponId, memberId)
			.orElseThrow(() -> new ApiException(ErrorCode.COUPON_NOT_FOUND));
		if (!"AVAILABLE".equals(memberCoupon.statusAt(Times.now()))) {
			throw new ApiException(ErrorCode.COUPON_NOT_APPLICABLE);
		}
		int discount = memberCoupon.getCoupon().discountFor(subtotal);
		if (discount <= 0) {
			throw new ApiException(ErrorCode.COUPON_NOT_APPLICABLE, "최소 주문 금액을 채우지 않아 쓸 수 없는 쿠폰입니다.");
		}
		return discount;
	}

	/** 주문에 사용 처리. 다른 주문이 먼저 썼으면 COUPON_NOT_APPLICABLE(주문 생성 전체가 되돌아간다). */
	@Transactional
	public void markUsed(Long memberId, Long memberCouponId, Long orderId) {
		if (memberCouponRepository.markUsed(memberCouponId, memberId, orderId, Times.now()) == 0) {
			throw new ApiException(ErrorCode.COUPON_NOT_APPLICABLE);
		}
	}

	/** 주문 취소: 그 주문에 쓴 쿠폰을 돌려준다. */
	@Transactional
	public void restore(Long orderId) {
		memberCouponRepository.restore(orderId);
	}

	/** 회원 쿠폰 한 장. status: AVAILABLE, USED, EXPIRED. */
	public record MemberCouponResponse(
		String id,
		String name,
		String discountType,
		int discountValue,
		Integer maxDiscount,
		int minOrderAmount,
		OffsetDateTime issuedAt,
		OffsetDateTime expiresAt,
		OffsetDateTime usedAt,
		String status
	) {

		static MemberCouponResponse from(MemberCoupon mc, LocalDateTime now) {
			Coupon coupon = mc.getCoupon();
			return new MemberCouponResponse(
				String.valueOf(mc.getId()),
				coupon.getName(),
				coupon.getDiscountType().name(),
				coupon.getDiscountValue(),
				coupon.getMaxDiscount(),
				coupon.getMinOrderAmount(),
				Times.toOffset(mc.getIssuedAt()),
				mc.getExpiresAt() == null ? null : Times.toOffset(mc.getExpiresAt()),
				mc.getUsedAt() == null ? null : Times.toOffset(mc.getUsedAt()),
				mc.statusAt(now));
		}
	}
}
