package com.eatomato.backend.analytics;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** 구매 단계 집계. 기간은 모두 [from, to) 다. */
public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {

	boolean existsByEventTypeAndOrderNumber(String eventType, String orderNumber);

	/** 그 단계 이벤트가 있었던 방문 수. */
	@Query("""
		select count(distinct e.sessionId) from AnalyticsEvent e
		where e.eventType = :type and e.occurredAt >= :from and e.occurredAt < :to
		""")
	long countSessions(@Param("type") String type, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	/** (건수, 금액 합) 한 행. */
	@Query("""
		select count(e), coalesce(sum(e.amount), 0) from AnalyticsEvent e
		where e.eventType = :type and e.occurredAt >= :from and e.occurredAt < :to
		""")
	List<Object[]> countAndSum(@Param("type") String type, @Param("from") LocalDateTime from,
		@Param("to") LocalDateTime to);

	/**
	 * 캠페인(?from=)별 (캠페인, 방문 수, 상품을 본 방문, 담은 방문, 결제 완료 방문, 결제 금액).
	 * 방문의 첫 조회에 남은 캠페인 기준이며, 같은 방문(30분) 안의 행동만 그 캠페인으로 센다.
	 */
	@Query(nativeQuery = true, value = """
		select s.campaign,
		       count(*),
		       sum(case when exists (select 1 from page_view p
		                             where p.session_id = s.session_id and p.page_type = 'PRODUCT') then 1 else 0 end),
		       sum(case when exists (select 1 from analytics_event e
		                             where e.session_id = s.session_id and e.event_type = 'ADD_TO_CART') then 1 else 0 end),
		       sum(case when exists (select 1 from analytics_event e
		                             where e.session_id = s.session_id and e.event_type = 'PURCHASE') then 1 else 0 end),
		       coalesce(sum((select sum(e.amount) from analytics_event e
		                     where e.session_id = s.session_id and e.event_type = 'PURCHASE')), 0)
		from page_view s
		where s.session_start = true and s.campaign is not null and s.viewed_at >= :from and s.viewed_at < :to
		group by s.campaign
		order by count(*) desc
		limit 20
		""")
	List<Object[]> campaigns(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	@Modifying
	@Query("delete from AnalyticsEvent e where e.occurredAt < :before")
	int deleteOccurredBefore(@Param("before") LocalDateTime before);
}
