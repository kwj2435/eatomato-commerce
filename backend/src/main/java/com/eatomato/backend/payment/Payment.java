package com.eatomato.backend.payment;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.order.Order;

/** 주문 한 건의 결제. provider·paymentKey 는 PG 가 준 값이다(지금은 MOCK). */
@Entity
@Table(name = "payment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "order_id")
	private Order order;

	private String provider;

	private String paymentKey;

	private int amount;

	@Enumerated(EnumType.STRING)
	private PaymentStatus status;

	private LocalDateTime requestedAt;

	private LocalDateTime approvedAt;

	private LocalDateTime cancelledAt;

	private String failureReason;

	public Payment(Order order, String provider, int amount) {
		this.order = order;
		this.provider = provider;
		this.amount = amount;
		this.status = PaymentStatus.READY;
		this.requestedAt = Times.now();
	}

	void approve(String paymentKey) {
		this.paymentKey = paymentKey;
		this.status = PaymentStatus.DONE;
		this.approvedAt = Times.now();
	}

	void fail(String reason) {
		this.status = PaymentStatus.FAILED;
		this.failureReason = reason == null ? null : reason.substring(0, Math.min(reason.length(), 300));
	}

	void cancel() {
		this.status = PaymentStatus.CANCELED;
		this.cancelledAt = Times.now();
	}
}
