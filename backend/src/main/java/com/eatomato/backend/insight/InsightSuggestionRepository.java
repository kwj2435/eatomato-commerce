package com.eatomato.backend.insight;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InsightSuggestionRepository extends JpaRepository<InsightSuggestion, Long> {

	List<InsightSuggestion> findAllByOrderByCreatedAtDescIdDesc();

	/** 에이전트에게 보여 줄 최근 제안(중복 방지·효과 확인용). */
	List<InsightSuggestion> findByCreatedAtGreaterThanEqualOrStatusInOrderByCreatedAtDesc(LocalDateTime from,
		List<InsightSuggestion.Status> statuses);

	long countByStatus(InsightSuggestion.Status status);
}
