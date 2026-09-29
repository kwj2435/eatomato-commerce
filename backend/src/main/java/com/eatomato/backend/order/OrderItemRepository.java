package com.eatomato.backend.order;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

	/** 결제가 끝난 주문 중 아직 후기를 쓰지 않은 상품. */
	@Query("""
		select oi from OrderItem oi join oi.order o
		where o.memberId = :memberId
		  and o.status in (com.eatomato.backend.order.OrderStatus.PAID,
		    com.eatomato.backend.order.OrderStatus.SHIPPING, com.eatomato.backend.order.OrderStatus.DELIVERED)
		  and oi.reviewed = false
		order by o.orderedAt desc, oi.id
		""")
	List<OrderItem> findReviewable(@Param("memberId") Long memberId);

	Optional<OrderItem> findByIdAndOrderMemberId(Long id, Long memberId);

	/** 판매량 상위 상품 (상품 id, 상품명, 수량 합, 매출 합). 취소 주문은 뺀다. */
	@Query("""
		select oi.productId, max(oi.productName), sum(oi.quantity), sum(oi.unitPrice * oi.quantity)
		from OrderItem oi join oi.order o
		where o.status in (com.eatomato.backend.order.OrderStatus.PAID,
		  com.eatomato.backend.order.OrderStatus.SHIPPING, com.eatomato.backend.order.OrderStatus.DELIVERED)
		group by oi.productId
		order by sum(oi.quantity) desc
		""")
	List<Object[]> topSellingProducts(org.springframework.data.domain.Pageable pageable);
}
