package com.eatomato.backend.order;

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

/** 주문 상태 변경 이력. changedBy 가 null 이면 시스템(결제 승인·만료)이 바꾼 것이다. */
@Entity
@Table(name = "order_status_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderStatusHistory {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long orderId;

	@Enumerated(EnumType.STRING)
	private OrderStatus fromStatus;

	@Enumerated(EnumType.STRING)
	private OrderStatus toStatus;

	private Long changedBy;

	private String reason;

	private LocalDateTime changedAt;

	public OrderStatusHistory(Long orderId, OrderStatus fromStatus, OrderStatus toStatus, Long changedBy,
		String reason) {
		this.orderId = orderId;
		this.fromStatus = fromStatus;
		this.toStatus = toStatus;
		this.changedBy = changedBy;
		this.reason = reason;
		this.changedAt = Times.now();
	}
}
