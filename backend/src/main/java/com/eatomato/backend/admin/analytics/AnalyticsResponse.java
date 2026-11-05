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
	List<Source> devices
) {

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
