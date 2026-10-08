package com.eatomato.backend.point;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PointHistoryRepository extends JpaRepository<PointHistory, Long> {

	List<PointHistory> findByMemberIdOrderByCreatedAtDescIdDesc(Long memberId, Pageable pageable);
}
