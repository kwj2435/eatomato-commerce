package com.eatomato.backend.order;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

	/** 배송이 시작된 주문(OrderStatus.REVIEWABLE_STATES) 중 아직 후기를 쓰지 않은 상품. */
	@Query("""
		select oi from OrderItem oi join oi.order o
		where o.memberId = :memberId
		  and o.status in (com.eatomato.backend.order.OrderStatus.SHIPPING,
		    com.eatomato.backend.order.OrderStatus.DELIVERED)
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
		  com.eatomato.backend.order.OrderStatus.PREPARING, com.eatomato.backend.order.OrderStatus.SHIPPING,
		  com.eatomato.backend.order.OrderStatus.DELIVERED)
		group by oi.productId
		order by sum(oi.quantity) desc
		""")
	List<Object[]> topSellingProducts(org.springframework.data.domain.Pageable pageable);

	/** 상품별 판매 수량 (상품 id, 수량 합). from 이후 주문 중 결제가 끝난 것만(방문자 분석의 조회 대비 판매). */
	@Query("""
		select oi.productId, sum(oi.quantity)
		from OrderItem oi join oi.order o
		where o.orderedAt >= :from and oi.productId in :productIds
		  and o.status in (com.eatomato.backend.order.OrderStatus.PAID,
		    com.eatomato.backend.order.OrderStatus.PREPARING, com.eatomato.backend.order.OrderStatus.SHIPPING,
		    com.eatomato.backend.order.OrderStatus.DELIVERED)
		group by oi.productId
		""")
	List<Object[]> paidQuantitiesSince(@Param("from") java.time.LocalDateTime from,
		@Param("productIds") java.util.Collection<Long> productIds);
}
