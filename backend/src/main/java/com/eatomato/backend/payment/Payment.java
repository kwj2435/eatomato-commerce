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

	/** PG 가 알려 준 결제수단(예: 카드, 가상계좌). 승인 전에는 비어 있다. */
	private String method;

	/** 무통장입금 웹훅(DEPOSIT_CALLBACK) 검증 값. */
	private String secret;

	private String vaBankCode;

	private String vaAccountNumber;

	private String vaCustomerName;

	/** 입금 기한. 지나면 주문을 자동 취소한다. */
	private LocalDateTime vaDueAt;

	public Payment(Order order, String provider, int amount) {
		this.order = order;
		this.provider = provider;
		this.amount = amount;
		this.status = PaymentStatus.READY;
		this.requestedAt = Times.now();
	}

	void approve(String paymentKey, String method) {
		this.paymentKey = paymentKey;
		this.method = method;
		this.status = PaymentStatus.DONE;
		this.approvedAt = Times.now();
	}

	/** 무통장입금 계좌 발급. 입금 웹훅이 오면 deposited 로 결제완료가 된다. */
	void awaitDeposit(String paymentKey, String method, String secret, PaymentGateway.VirtualAccount account) {
		this.paymentKey = paymentKey;
		this.method = method;
		this.secret = secret;
		this.vaBankCode = account.bankCode();
		this.vaAccountNumber = account.accountNumber();
		this.vaCustomerName = account.customerName();
		this.vaDueAt = account.dueAt();
		this.status = PaymentStatus.WAITING_FOR_DEPOSIT;
	}

	void deposited() {
		this.status = PaymentStatus.DONE;
		this.approvedAt = Times.now();
	}

	/** 무통장입금(가상계좌)으로 받은 결제인지. 입금 뒤 환불하려면 고객 환불 계좌가 필요하다. */
	public boolean isVirtualAccount() {
		return vaAccountNumber != null;
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
