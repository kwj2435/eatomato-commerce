package com.eatomato.backend.point;

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

/** 적립금 적립·사용 내역 한 줄. amount 는 적립 +, 사용 -. balanceAfter 는 반영 뒤 잔액. */
@Entity
@Table(name = "point_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PointHistory {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long memberId;

	@Enumerated(EnumType.STRING)
	private PointType type;

	private int amount;

	private int balanceAfter;

	private String reason;

	private Long orderId;

	private LocalDateTime createdAt;

	PointHistory(Long memberId, PointType type, int amount, int balanceAfter, String reason, Long orderId) {
		this.memberId = memberId;
		this.type = type;
		this.amount = amount;
		this.balanceAfter = balanceAfter;
		this.reason = reason;
		this.orderId = orderId;
		this.createdAt = Times.now();
	}
}
