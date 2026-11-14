package com.eatomato.backend.admin.analytics;

import java.time.LocalDate;
import java.util.List;

/**
 * 관리자 방문자 분석.
 * 방문자 = 서로 다른 브라우저 수, 방문 = 30분 이상 쉬지 않고 이어진 조회 묶음, 조회 = 페이지를 연 횟수.
 * 관리자 화면과 관리자 계정의 조회, 검색 로봇은 세지 않는다.
 */
public record AnalyticsResponse(
	/** 조회 기간(오늘 포함 며칠). */
	int days,
	Totals today,
	/** 어제 같은 시각까지. 오늘과 견주는 용도. */
	Totals yesterdaySameTime,
	Totals range,
	/** 최근 5분 안에 페이지를 연 방문자 수. */
	long liveVisitors,
	/** 기간의 날짜별, 오래된 날부터. 기록이 없는 날도 0 으로 채운다. */
	List<Daily> daily,
	/** 오늘 0~23시. */
	List<Hourly> hourlyToday,
	List<TopPage> topPages,
	List<TopProduct> topProducts,
	/** 유입 경로별 방문 수. host 가 null 이면 직접 방문(주소 입력·북마크·앱 등). */
	List<Source> referrers,
	/** 기기별 방문자 수(MOBILE·TABLET·DESKTOP). */
	List<Source> devices,
	/** 기간의 구매 단계(방문 기준). */
	Funnel funnel,
	/** 링크 ?from= 캠페인별 성과. 많이 들어온 순 20개. */
	List<Campaign> campaigns,
	/** 화면 안 행동(메인 섹션 노출·클릭, 상품 상세 행동). 2026-11-14 부터 모은다. */
	Engagement engagement
) {

	/**
	 * homeSessions: 메인을 연 방문 수. sections 는 메인에 보이는 순서대로.
	 * productSessions: 상품 상세를 연 방문 수(상품 상세 행동의 분모).
	 */
	public record Engagement(long homeSessions, List<SectionStat> sections, List<SectionClick> topClicks,
		long productSessions, List<ProductAction> productActions, List<Source> topOptions) {
	}

	/** viewSessions: 그 섹션이 화면에 보인 방문, clickSessions: 그 섹션에서 링크를 누른 방문, clicks: 누른 횟수. */
	public record SectionStat(String section, long viewSessions, long clickSessions, long clicks) {
	}

	public record SectionClick(String section, String path, long clicks) {
	}

	/** type: PRODUCT_OPTION·PRODUCT_IMAGE·PRODUCT_TAB·PRODUCT_REVIEW. */
	public record ProductAction(String type, long count, long sessions) {
	}

	/**
	 * 방문 수 → 상품을 본 방문 → 장바구니에 담은 방문 → 주문서를 연 방문 → 결제하기를 누른 방문 → 결제를 마친 방문.
	 * purchases·revenue 는 결제 완료 주문 수와 금액.
	 */
	public record Funnel(long sessions, long productSessions, long cartSessions, long checkoutPageSessions,
		long checkoutStartSessions, long purchaseSessions, long purchases, long revenue) {
	}

	public record Campaign(String campaign, long sessions, long productSessions, long cartSessions,
		long purchaseSessions, long revenue) {
	}

	public record Totals(long visitors, long sessions, long pageViews) {
	}

	public record Daily(LocalDate date, long visitors, long sessions, long pageViews) {
	}

	public record Hourly(int hour, long visitors, long pageViews) {
	}

	/** productName 은 상품 페이지일 때만 있다. */
	public record TopPage(String path, String pageType, String productName, long views, long visitors) {
	}

	/** purchased: 기간 안에 결제가 끝난 주문의 판매 수량. */
	public record TopProduct(String productId, String slug, String name, String imageUrl, long views, long visitors,
		long purchased) {
	}

	public record Source(String key, long count) {
	}
}
