package com.eatomato.backend.order;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {

	@EntityGraph(attributePaths = "items")
	List<Order> findByMemberIdOrderByOrderedAtDescIdDesc(Long memberId);

	@EntityGraph(attributePaths = "items")
	Optional<Order> findByOrderNumberAndMemberId(String orderNumber, Long memberId);

	boolean existsByOrderNumber(String orderNumber);
}
