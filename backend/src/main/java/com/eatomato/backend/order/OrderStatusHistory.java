package com.eatomato.backend.order;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.DomainEvents;

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

	/** historyRepository.save() 때 Spring Data 가 발행한다(알림톡 등). 이력은 새로 만들기만 하고 고치지 않는다. */
	@DomainEvents
	Collection<Object> domainEvents() {
		return List.of(new OrderStatusChangedEvent(orderId, fromStatus, toStatus));
	}
}
