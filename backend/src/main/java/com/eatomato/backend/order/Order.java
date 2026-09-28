package com.eatomato.backend.order;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
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

import com.eatomato.backend.cart.ShippingPolicy;
import com.eatomato.backend.global.time.Times;

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

	@Column(name = "total_amount")
	private int total;

	private LocalDateTime orderedAt;

	@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("id")
	private List<OrderItem> items = new ArrayList<>();

	public Order(String orderNumber, Long memberId) {
		this.orderNumber = orderNumber;
		this.memberId = memberId;
		this.status = OrderStatus.PAID;
		this.orderedAt = Times.now();
	}

	public void addItem(OrderItem item) {
		items.add(item);
		item.assignTo(this);
		recalculate();
	}

	private void recalculate() {
		this.subtotal = items.stream().mapToInt(OrderItem::lineTotal).sum();
		this.shippingFee = ShippingPolicy.feeFor(subtotal);
		this.total = subtotal + shippingFee;
	}
}
