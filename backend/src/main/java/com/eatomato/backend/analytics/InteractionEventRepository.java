package com.eatomato.backend.analytics;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** 화면 안 행동 집계. 기간은 모두 [from, to) 다. */
public interface InteractionEventRepository extends JpaRepository<InteractionEvent, Long> {

	/** 메인 섹션별 (섹션, 본 방문 수, 누른 방문 수, 누른 횟수). */
	@Query(nativeQuery = true, value = """
		select e.section,
		       count(distinct case when e.event_type = 'SECTION_VIEW' then e.session_id end),
		       count(distinct case when e.event_type = 'SECTION_CLICK' then e.session_id end),
		       sum(case when e.event_type = 'SECTION_CLICK' then 1 else 0 end)
		from interaction_event e
		where e.event_type in ('SECTION_VIEW', 'SECTION_CLICK') and e.section is not null
		  and e.occurred_at >= :from and e.occurred_at < :to
		group by e.section
		""")
	List<Object[]> sectionStats(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	/** 메인 섹션 안에서 많이 눌린 링크 (섹션, 주소, 누른 횟수). */
	@Query(nativeQuery = true, value = """
		select e.section, e.detail, count(*)
		from interaction_event e
		where e.event_type = 'SECTION_CLICK' and e.detail is not null
		  and e.occurred_at >= :from and e.occurred_at < :to
		group by e.section, e.detail
		order by count(*) desc
		limit 15
		""")
	List<Object[]> topSectionClicks(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	/** 상품 상세 행동별 (종류, 횟수, 방문 수). */
	@Query(nativeQuery = true, value = """
		select e.event_type, count(*), count(distinct e.session_id)
		from interaction_event e
		where e.event_type in ('PRODUCT_OPTION', 'PRODUCT_IMAGE', 'PRODUCT_TAB', 'PRODUCT_REVIEW')
		  and e.occurred_at >= :from and e.occurred_at < :to
		group by e.event_type
		""")
	List<Object[]> productActionStats(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	/** 많이 고른 옵션 (옵션, 횟수). */
	@Query(nativeQuery = true, value = """
		select e.detail, count(*)
		from interaction_event e
		where e.event_type = 'PRODUCT_OPTION' and e.detail is not null
		  and e.occurred_at >= :from and e.occurred_at < :to
		group by e.detail
		order by count(*) desc
		limit 10
		""")
	List<Object[]> topOptions(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	@Modifying
	@Query("delete from InteractionEvent e where e.occurredAt < :before")
	int deleteOccurredBefore(@Param("before") LocalDateTime before);
}
