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

	@Query("select o from ShopOrder o where o.orderedAt >= :from and o.status <> com.eatomato.backend.order.OrderStatus.CANCELLED")
	List<Order> findValidOrdersSince(@Param("from") LocalDateTime from);

	@Query("select o.status, count(o) from ShopOrder o group by o.status")
	List<Object[]> countByStatus();

	/** 회원별 (주문 수, 결제 합계). 취소 주문은 뺀다. */
	@Query("""
		select o.memberId, count(o), coalesce(sum(o.total), 0) from ShopOrder o
		where o.memberId in :memberIds and o.status <> com.eatomato.backend.order.OrderStatus.CANCELLED
		group by o.memberId
		""")
	List<Object[]> summarizeByMembers(@Param("memberIds") Collection<Long> memberIds);

	List<Order> findTop10ByMemberIdOrderByOrderedAtDescIdDesc(Long memberId);

	List<Order> findTop5ByOrderByOrderedAtDescIdDesc();
}
