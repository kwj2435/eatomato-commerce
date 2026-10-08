package com.eatomato.backend.coupon;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 회원이 받은 쿠폰 한 장. 사용·반환은 MemberCouponRepository 의 조건부 UPDATE 로 한다. */
@Entity
@Table(name = "member_coupon")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberCoupon {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long memberId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "coupon_id")
	private Coupon coupon;

	private LocalDateTime issuedAt;

	private LocalDateTime expiresAt;

	private LocalDateTime usedAt;

	private Long orderId;

	MemberCoupon(Long memberId, Coupon coupon, LocalDateTime issuedAt) {
		this.memberId = memberId;
		this.coupon = coupon;
		this.issuedAt = issuedAt;
		this.expiresAt = coupon.expiresAtFrom(issuedAt);
	}

	/** AVAILABLE(사용 가능), USED(사용함), EXPIRED(기한 지남). */
	public String statusAt(LocalDateTime now) {
		if (usedAt != null) {
			return "USED";
		}
		return expiresAt != null && !expiresAt.isAfter(now) ? "EXPIRED" : "AVAILABLE";
	}
}
