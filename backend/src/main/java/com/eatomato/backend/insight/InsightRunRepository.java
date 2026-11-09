package com.eatomato.backend.insight;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InsightRunRepository extends JpaRepository<InsightRun, Long> {

	List<InsightRun> findTop20ByOrderByCreatedAtDescIdDesc();

	boolean existsByStatusIn(Collection<InsightRun.Status> statuses);

	long countByKindAndCreatedAtGreaterThanEqual(InsightRun.Kind kind, LocalDateTime from);

	boolean existsByKindAndCreatedAtGreaterThanEqual(InsightRun.Kind kind, LocalDateTime from);

	/** 가장 최근에 끝난 분석(오늘의 요약에 쓴다). */
	Optional<InsightRun> findFirstByStatusOrderByFinishedAtDescIdDesc(InsightRun.Status status);

	Optional<InsightRun> findFirstByStatusInOrderByCreatedAtDescIdDesc(Collection<InsightRun.Status> statuses);

	Optional<InsightRun> findFirstByStatusOrderByCreatedAtAscIdAsc(InsightRun.Status status);

	/** PENDING 인 실행만 RUNNING 으로 바꾼다. 워커가 둘이어도 한 실행을 한 번만 가져가게 1(성공)·0(이미 가져감)을 돌려준다. */
	@Modifying(clearAutomatically = true)
	@Query("""
		update InsightRun r set r.status = com.eatomato.backend.insight.InsightRun.Status.RUNNING, r.startedAt = :now
		where r.id = :id and r.status = com.eatomato.backend.insight.InsightRun.Status.PENDING
		""")
	int claim(@Param("id") Long id, @Param("now") LocalDateTime now);

	List<InsightRun> findByStatusAndStartedAtBefore(InsightRun.Status status, LocalDateTime before);
}
