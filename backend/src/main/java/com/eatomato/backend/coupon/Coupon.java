package com.eatomato.backend.coupon;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.eatomato.backend.global.time.Times;

/**
 * 쿠폰(발급 원본). 회원에게는 MemberCoupon 으로 나눠 준다.
 * 할인은 상품 금액(배송비 제외)에만 붙는다.
 */
@Entity
@Table(name = "coupon")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Coupon {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String name;

	@Enumerated(EnumType.STRING)
	private DiscountType discountType;

	/** FIXED 면 원, PERCENT 면 %. */
	private int discountValue;

	/** PERCENT 할인 상한(원). 비우면 상한 없음. */
	private Integer maxDiscount;

	private int minOrderAmount;

	/** 발급일부터 며칠 동안 쓸 수 있는지. */
	private Integer validDays;

	/** 이 시각까지만 쓸 수 있다. validDays 와 같이 있으면 이른 쪽. */
	private LocalDateTime validUntil;

	/** 신규 가입 때 자동 발급. */
	private boolean issueOnSignup;

	/** false 면 새로 발급하지 않는다(이미 받은 쿠폰은 기한까지 쓸 수 있다). */
	private boolean active;

	private LocalDateTime createdAt;

	public Coupon(String name, DiscountType discountType, int discountValue, Integer maxDiscount, int minOrderAmount,
		Integer validDays, LocalDateTime validUntil, boolean issueOnSignup) {
		this.name = name;
		this.discountType = discountType;
		this.discountValue = discountValue;
		this.maxDiscount = maxDiscount;
		this.minOrderAmount = minOrderAmount;
		this.validDays = validDays;
		this.validUntil = validUntil;
		this.issueOnSignup = issueOnSignup;
		this.active = true;
		this.createdAt = Times.now();
	}

	/** 상품 금액(subtotal)에 대한 할인액. 최소 주문 금액에 못 미치면 0. 상품 금액을 넘지 않는다. */
	public int discountFor(int subtotal) {
		if (subtotal < minOrderAmount) {
			return 0;
		}
		int discount = discountType == DiscountType.FIXED
			? discountValue
			: (int) ((long) subtotal * discountValue / 100);
		if (discountType == DiscountType.PERCENT && maxDiscount != null) {
			discount = Math.min(discount, maxDiscount);
		}
		return Math.min(discount, subtotal);
	}

	/** issuedAt 에 발급하면 언제까지 쓸 수 있는지. null 이면 기한 없음. */
	public LocalDateTime expiresAtFrom(LocalDateTime issuedAt) {
		LocalDateTime byDays = validDays == null ? null : issuedAt.plusDays(validDays);
		if (byDays == null) {
			return validUntil;
		}
		return validUntil == null || byDays.isBefore(validUntil) ? byDays : validUntil;
	}

	/** 지금 새로 발급할 수 있는지(활성 + 종료일 전). */
	public boolean isIssuable() {
		return active && (validUntil == null || validUntil.isAfter(Times.now()));
	}

	public void changeActive(boolean active) {
		this.active = active;
	}

	public void changeIssueOnSignup(boolean issueOnSignup) {
		this.issueOnSignup = issueOnSignup;
	}
}
