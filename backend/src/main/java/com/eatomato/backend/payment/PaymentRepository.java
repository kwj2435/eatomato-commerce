package com.eatomato.backend.payment;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.eatomato.backend.order.Order;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

	Optional<Payment> findByOrder(Order order);

	List<Payment> findByOrderIn(Collection<Order> orders);

	List<Payment> findByStatusAndVaDueAtBefore(PaymentStatus status, LocalDateTime dueAt);

	/** 입금 기한이 [from, to] 사이인 결제 수(입금 기한이 곧 끝나는 무통장입금). */
	long countByStatusAndVaDueAtBetween(PaymentStatus status, LocalDateTime from, LocalDateTime to);
}
