package com.eatomato.backend.order;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {

	@EntityGraph(attributePaths = "items")
	List<Order> findByMemberIdOrderByOrderedAtDescIdDesc(Long memberId);

	@EntityGraph(attributePaths = "items")
	Optional<Order> findByOrderNumberAndMemberId(String orderNumber, Long memberId);

	boolean existsByOrderNumber(String orderNumber);

	// ── 관리자 ──────────────────────────────────────────────

	Optional<Order> findByOrderNumber(String orderNumber);

	/**
	 * 주문 검색. keyword 는 주문번호 부분 일치 또는 memberIds(아이디로 찾은 회원) 중 하나에 걸리면 된다.
	 * memberIds 가 비면 JPQL `in ()` 이 깨지므로 호출부가 존재하지 않는 id(-1)를 넣어 준다.
	 */
	@Query("""
		select o from ShopOrder o
		where (:status is null or o.status = :status)
		  and (:keyword is null or o.orderNumber like concat('%', :keyword, '%') or o.memberId in :memberIds)
		""")
	Page<Order> searchForAdmin(@Param("status") OrderStatus status, @Param("keyword") String keyword,
		@Param("memberIds") Collection<Long> memberIds, Pageable pageable);

	String PAID = "com.eatomato.backend.order.OrderStatus.PAID, com.eatomato.backend.order.OrderStatus.PREPARING, "
		+ "com.eatomato.backend.order.OrderStatus.SHIPPING, com.eatomato.backend.order.OrderStatus.DELIVERED";

	/** 결제가 끝난 주문(결제완료·상품준비중·배송중·배송완료). 결제대기·취소는 매출에서 뺀다. */
	@Query("select o from ShopOrder o where o.orderedAt >= :from and o.status in (" + PAID + ")")
	List<Order> findValidOrdersSince(@Param("from") LocalDateTime from);

	@Query("select o.status, count(o) from ShopOrder o group by o.status")
	List<Object[]> countByStatus();

	/** 회원별 (주문 수, 결제 합계). 취소 주문은 뺀다. */
	@Query("""
		select o.memberId, count(o), coalesce(sum(o.total), 0) from ShopOrder o
		where o.memberId in :memberIds and o.status in (com.eatomato.backend.order.OrderStatus.PAID,
		  com.eatomato.backend.order.OrderStatus.PREPARING, com.eatomato.backend.order.OrderStatus.SHIPPING,
		  com.eatomato.backend.order.OrderStatus.DELIVERED)
		group by o.memberId
		""")
	List<Object[]> summarizeByMembers(@Param("memberIds") Collection<Long> memberIds);

	List<Order> findTop10ByMemberIdOrderByOrderedAtDescIdDesc(Long memberId);

	List<Order> findTop5ByOrderByOrderedAtDescIdDesc();

	List<Order> findByStatusAndOrderedAtBefore(OrderStatus status, LocalDateTime before);

	boolean existsByMemberIdAndStatusIn(Long memberId, Collection<OrderStatus> statuses);

	/** from 이후 주문 전부(상태 무관, 상품 포함). 마케팅 인사이트 원자료. */
	@EntityGraph(attributePaths = "items")
	List<Order> findByOrderedAtGreaterThanEqual(LocalDateTime from);

	// ── 운영 브리핑 ──────────────────────────────────────────

	/** 그 상태의 주문 수. */
	@Query("select count(o) from ShopOrder o where o.status = :status")
	long countWithStatus(@Param("status") OrderStatus status);

	/** 그 상태 주문 중 가장 이른 결제 시각. 주문이 없으면 null. */
	@Query("select min(o.paidAt) from ShopOrder o where o.status = :status")
	LocalDateTime findOldestPaidAt(@Param("status") OrderStatus status);

	/** 상품준비중 중 송장(택배사·송장번호)을 아직 넣지 않은 주문 수. */
	@Query("""
		select count(o) from ShopOrder o
		where o.status = com.eatomato.backend.order.OrderStatus.PREPARING
		  and (o.courier is null or o.trackingNumber is null)
		""")
	long countPreparingWithoutTracking();
}
