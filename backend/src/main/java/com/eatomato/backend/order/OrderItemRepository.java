package com.eatomato.backend.order;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

	/** 결제 완료된 주문 중 아직 후기를 쓰지 않은 상품. */
	@Query("""
		select oi from OrderItem oi join oi.order o
		where o.memberId = :memberId
		  and o.status = com.eatomato.backend.order.OrderStatus.PAID
		  and oi.reviewed = false
		order by o.orderedAt desc, oi.id
		""")
	List<OrderItem> findReviewable(@Param("memberId") Long memberId);

	Optional<OrderItem> findByIdAndOrderMemberId(Long id, Long memberId);
}
