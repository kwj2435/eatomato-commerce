package com.eatomato.backend.shipping;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.eatomato.backend.global.time.Times;

/**
 * 배송비 정책. 한 줄(id=1)만 쓰고 관리자 화면에서 바꾼다.
 *
 * - 상품 합계가 0 이면 배송비 0
 * - 무료배송 기준 이상이면 기본 배송비 0
 * - 제주 지역(우편번호 63으로 시작)은 추가 배송비를 더한다(무료배송이어도 더한다)
 */
@Entity
@Table(name = "shipping_policy")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ShippingPolicy {

	public static final int SINGLE_ROW_ID = 1;

	@Id
	private Integer id;

	private int baseFee;

	private int freeThreshold;

	private int remoteAreaFee;

	private LocalDateTime updatedAt;

	public void update(int baseFee, int freeThreshold, int remoteAreaFee) {
		this.baseFee = baseFee;
		this.freeThreshold = freeThreshold;
		this.remoteAreaFee = remoteAreaFee;
		this.updatedAt = Times.now();
	}

	/** 배송지를 모를 때(장바구니)의 배송비. */
	public int feeFor(int subtotal) {
		if (subtotal <= 0) {
			return 0;
		}
		return subtotal >= freeThreshold ? 0 : baseFee;
	}

	/** 배송지를 알 때(주문서)의 배송비. 제주 추가 배송비를 포함한다. */
	public int feeFor(int subtotal, String zipCode) {
		if (subtotal <= 0) {
			return 0;
		}
		return feeFor(subtotal) + (isRemoteArea(zipCode) ? remoteAreaFee : 0);
	}

	public int freeShippingRemainder(int subtotal) {
		return Math.max(0, freeThreshold - subtotal);
	}

	/** 제주 우편번호(63000~63644)는 63 으로 시작한다. 도서 산간 전체 목록은 아직 반영하지 않았다. */
	public static boolean isRemoteArea(String zipCode) {
		return zipCode != null && zipCode.trim().startsWith("63");
	}
}
