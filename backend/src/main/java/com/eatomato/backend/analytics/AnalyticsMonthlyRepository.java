package com.eatomato.backend.analytics;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AnalyticsMonthlyRepository extends JpaRepository<AnalyticsMonthly, LocalDate> {

	List<AnalyticsMonthly> findAllByOrderByMonthStartAsc();
}
