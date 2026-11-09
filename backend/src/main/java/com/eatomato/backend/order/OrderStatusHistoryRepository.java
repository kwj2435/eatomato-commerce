package com.eatomato.backend.order;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long> {

	List<OrderStatusHistory> findByOrderIdOrderByChangedAtAscIdAsc(Long orderId);

	/** 기간 [from, to) 에 취소된 주문의 (취소 전 상태, 건수). 결제 후 취소(환불)와 결제 전 취소를 나눠 보는 데 쓴다. */
	@Query("""
		select h.fromStatus, count(h) from OrderStatusHistory h
		where h.toStatus = com.eatomato.backend.order.OrderStatus.CANCELLED
		  and h.changedAt >= :from and h.changedAt < :to
		group by h.fromStatus
		""")
	List<Object[]> countCancelledByFromStatus(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
