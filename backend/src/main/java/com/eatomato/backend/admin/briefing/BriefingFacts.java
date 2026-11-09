package com.eatomato.backend.admin.briefing;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 운영 브리핑에 쓰는 사실(숫자). AdminBriefingService 가 DB 에서 모으고 BriefingRules 가 할 일로 바꾼다.
 *
 * 고객 개인정보(이름·연락처·주소·주문번호·회원 아이디·후기 작성자)는 담지 않는다.
 * 나중에 AI 요약을 붙일 때 이 값을 그대로 넘길 수 있게 하기 위해서다.
 *
 * @param now                      모은 시각(KST)
 * @param paidWaiting              결제완료(상품 준비를 시작하지 않은) 주문 수
 * @param oldestPaidAt             그중 가장 이른 결제 시각. 없으면 null
 * @param preparingWithoutTracking 상품준비중 중 송장을 넣지 않은 주문 수
 * @param preparingWithTracking    상품준비중 중 송장을 넣었지만 배송중으로 바꾸지 않은 주문 수
 * @param depositDueSoon           입금 기한이 곧 끝나는 무통장입금 주문 수
 * @param lowStock                 재고가 기준 이하인 판매 중 상품(품절 포함)
 * @param lowReviews               최근 들어온 낮은 별점 후기
 * @param paidCancelsYesterday     어제 결제 후 취소(환불)된 주문 수
 * @param unpaidCancelsYesterday   어제 결제 전에 취소된 주문 수(결제창 이탈·시간 초과 등)
 */
public record BriefingFacts(
	LocalDateTime now,
	long paidWaiting,
	LocalDateTime oldestPaidAt,
	long preparingWithoutTracking,
	long preparingWithTracking,
	long depositDueSoon,
	List<StockItem> lowStock,
	List<ReviewItem> lowReviews,
	long paidCancelsYesterday,
	long unpaidCancelsYesterday,
	Day yesterday,
	Day sameDayLastWeek
) {

	/** @param soldLast7Days 최근 7일 결제된 판매 수량 */
	public record StockItem(long productId, String name, int stock, long soldLast7Days) {
	}

	/** @param excerpt 후기 본문 앞부분(줄바꿈 없이) */
	public record ReviewItem(String productName, String slug, int rating, String excerpt) {
	}

	/** 하루 실적. 주문·매출은 결제가 끝난 주문만, 방문자는 페이지 조회 기준. */
	public record Day(LocalDate date, long orders, long revenue, long visitors) {
	}
}
