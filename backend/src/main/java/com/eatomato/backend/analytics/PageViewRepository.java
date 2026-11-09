package com.eatomato.backend.analytics;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** 방문자 분석 집계. 기간은 모두 [from, to) 다. */
public interface PageViewRepository extends JpaRepository<PageView, Long> {

	/** (방문자 수, 방문 수, 조회 수) 한 행. */
	@Query("""
		select count(distinct v.visitorId), count(distinct v.sessionId), count(v)
		from PageView v where v.viewedAt >= :from and v.viewedAt < :to
		""")
	List<Object[]> totals(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	/** 날짜별 (날짜, 방문자 수, 방문 수, 조회 수). */
	@Query("""
		select v.viewDate, count(distinct v.visitorId), count(distinct v.sessionId), count(v)
		from PageView v where v.viewDate >= :from
		group by v.viewDate
		""")
	List<Object[]> daily(@Param("from") LocalDate from);

	/** 그날 시간대별 (시, 방문자 수, 조회 수). */
	@Query("""
		select v.viewHour, count(distinct v.visitorId), count(v)
		from PageView v where v.viewDate = :date
		group by v.viewHour
		""")
	List<Object[]> hourly(@Param("date") LocalDate date);

	/** 많이 본 페이지 (경로, 페이지 종류, 상품 id, 조회 수, 방문자 수). */
	@Query("""
		select v.path, max(v.pageType), max(v.productId), count(v), count(distinct v.visitorId)
		from PageView v where v.viewedAt >= :from
		group by v.path
		order by count(v) desc
		""")
	List<Object[]> topPages(@Param("from") LocalDateTime from, Pageable pageable);

	/** 많이 본 상품 (상품 id, 조회 수, 방문자 수). */
	@Query("""
		select v.productId, count(v), count(distinct v.visitorId)
		from PageView v where v.productId is not null and v.viewedAt >= :from
		group by v.productId
		order by count(v) desc
		""")
	List<Object[]> topProducts(@Param("from") LocalDateTime from, Pageable pageable);

	/** 유입 경로별 방문 수 (호스트, 방문 수). 호스트가 null 이면 직접 방문. */
	@Query("""
		select v.referrerHost, count(v)
		from PageView v where v.sessionStart = true and v.viewedAt >= :from
		group by v.referrerHost
		order by count(v) desc
		""")
	List<Object[]> referrers(@Param("from") LocalDateTime from);

	/** 기기별 방문자 수 (기기, 방문자 수). */
	@Query("""
		select v.device, count(distinct v.visitorId)
		from PageView v where v.viewedAt >= :from
		group by v.device
		""")
	List<Object[]> devices(@Param("from") LocalDateTime from);

	/** 그 종류의 페이지를 연 방문 수. */
	@Query("""
		select count(distinct v.sessionId) from PageView v
		where v.pageType = :type and v.viewedAt >= :from and v.viewedAt < :to
		""")
	long countSessionsByType(@Param("type") String type, @Param("from") LocalDateTime from,
		@Param("to") LocalDateTime to);

	@Query("select count(distinct v.visitorId) from PageView v where v.viewedAt >= :from")
	long countVisitorsSince(@Param("from") LocalDateTime from);

	/** from 이후 페이지 조회 전부(마케팅 인사이트 원자료). */
	List<PageView> findByViewedAtGreaterThanEqual(LocalDateTime from);

	@Modifying
	@Query("delete from PageView v where v.viewedAt < :before")
	int deleteViewedBefore(@Param("before") LocalDateTime before);
}
