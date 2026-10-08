package com.eatomato.backend.order;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.shipping.ShippingPolicy;

/** JPQL 예약어(ORDER)와 겹치지 않도록 엔티티 이름을 ShopOrder 로 둔다. */
@Entity(name = "ShopOrder")
@Table(name = "orders")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String orderNumber;

	private Long memberId;

	@Enumerated(EnumType.STRING)
	private OrderStatus status;

	private int subtotal;

	private int shippingFee;

	/** 결제할 금액 = subtotal + shippingFee - couponDiscount - pointUsed. */
	@Column(name = "total_amount")
	private int total;

	/** 쿠폰 할인(상품 금액에만). */
	private int couponDiscount;

	/** 사용한 적립금. */
	private int pointUsed;

	/** 사용한 회원 쿠폰. 취소하면 이 쿠폰을 돌려준다. */
	private Long memberCouponId;

	/** 배송완료 때 적립한 금액. */
	private int pointsEarned;

	/** 배송지. 배송지 입력 기능 이전에 만들어진 주문은 비어 있다. */
	@Embedded
	private ShippingAddress shippingAddress;

	private LocalDateTime orderedAt;

	private LocalDateTime paidAt;

	private LocalDateTime cancelledAt;

	@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("id")
	private List<OrderItem> items = new ArrayList<>();

	/** 결제대기 주문. 결제 승인(PaymentService.confirm)에서 결제완료로 바뀐다. */
	public Order(String orderNumber, Long memberId, ShippingAddress shippingAddress) {
		this.orderNumber = orderNumber;
		this.memberId = memberId;
		this.shippingAddress = shippingAddress;
		this.status = OrderStatus.PENDING_PAYMENT;
		this.orderedAt = Times.now();
	}

	public void addItem(OrderItem item) {
		items.add(item);
		item.assignTo(this);
	}

	/** 금액 확정. 배송지 우편번호로 제주 추가 배송비까지 계산한다. */
	public void calculate(ShippingPolicy policy) {
		this.subtotal = items.stream().mapToInt(OrderItem::lineTotal).sum();
		this.shippingFee = policy.feeFor(subtotal, shippingAddress == null ? null : shippingAddress.getZipCode());
		this.total = subtotal + shippingFee - couponDiscount - pointUsed;
	}

	/** 쿠폰·적립금 반영. calculate 뒤에 부른다. 결제할 금액이 0 아래로 내려가지 않게 호출하는 쪽이 확인한다. */
	public void applyDiscounts(Long memberCouponId, int couponDiscount, int pointUsed) {
		this.memberCouponId = memberCouponId;
		this.couponDiscount = couponDiscount;
		this.pointUsed = pointUsed;
		this.total = subtotal + shippingFee - couponDiscount - pointUsed;
	}

	public void markPointsEarned(int points) {
		this.pointsEarned = points;
	}

	/** 배송완료 적립금: 상품별 (단가 × 수량) × 주문 시점 적립률, 원 미만 버림. */
	public int rewardPoints() {
		return items.stream().mapToInt(item -> item.lineTotal() * item.getRewardRate() / 100).sum();
	}

	public void markPaid() {
		transitionTo(OrderStatus.PAID);
		this.paidAt = Times.now();
	}

	/** 무통장입금 계좌 발급. 입금이 확인되면 markPaid 로 결제완료가 된다. */
	public void markAwaitingDeposit() {
		transitionTo(OrderStatus.AWAITING_DEPOSIT);
	}

	public void cancel() {
		transitionTo(OrderStatus.CANCELLED);
		this.cancelledAt = Times.now();
	}

	/** 허용된 방향으로만 바꾼다(OrderStatus.next). */
	public void transitionTo(OrderStatus next) {
		if (!status.next().contains(next)) {
			throw new ApiException(ErrorCode.INVALID_ORDER_STATUS);
		}
		this.status = next;
	}

	public int totalQuantity() {
		return items.stream().mapToInt(OrderItem::getQuantity).sum();
	}
}
