package com.eatomato.backend.notification;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {

	boolean existsByDedupKey(String dedupKey);

	List<NotificationLog> findByOrderIdOrderByIdAsc(Long orderId);
}
