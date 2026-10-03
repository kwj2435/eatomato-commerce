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
}
