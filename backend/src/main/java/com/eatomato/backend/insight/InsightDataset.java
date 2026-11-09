package com.eatomato.backend.insight;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 마케팅 인사이트 에이전트에 넘기는 원자료. 분석(집계)은 Python 워커가 한다.
 *
 * 고객 개인정보는 넣지 않는다: 이름·연락처·주소·이메일·주문번호·회원 아이디·후기 작성자.
 * 재구매를 셀 수 있게 회원은 buyer(회원 id 의 HMAC 앞 16자)로만 구분한다. 방문자·방문 ID 는 원래 브라우저가 만든 임의 값이다.
 * 시각은 모두 KST.
 */
public record InsightDataset(
	LocalDateTime from,
	LocalDateTime to,
	List<PageViewRow> pageViews,
	List<EventRow> events,
	List<OrderRow> orders,
	List<ProductRow> products,
	List<ReviewRow> reviews
) {

	/** pageType: HOME·CATEGORY·PRODUCT·SEARCH·CART·CHECKOUT·MYPAGE·NOTICE·LOGIN·OTHER. referrerHost·campaign 은 방문의 첫 조회에만 있다. */
	public record PageViewRow(String visitorId, String sessionId, LocalDateTime at, String pageType, Long productId,
		boolean sessionStart, String referrerHost, String campaign, String device) {
	}

	/** type: ADD_TO_CART(amount=수량) · CHECKOUT_START · PURCHASE(amount=결제 금액). */
	public record EventRow(String visitorId, String sessionId, String type, Long productId, Integer amount,
		LocalDateTime at) {
	}

	/** status 는 주문 상태 그대로(결제 전·취소 포함). buyer 는 비회원이면 null. */
	public record OrderRow(LocalDateTime orderedAt, LocalDateTime paidAt, String status, int total, int subtotal,
		int shippingFee, int couponDiscount, int pointUsed, boolean guest, String buyer, List<ItemRow> items) {
	}

	public record ItemRow(Long productId, String productName, int quantity, int unitPrice) {
	}

	/** stock 이 null 이면 재고를 관리하지 않는 상품. visible=false 는 숨김. */
	public record ProductRow(Long id, String name, String category, String subcategory, int price, Integer salePrice,
		Integer stock, boolean visible, BigDecimal rating, long reviewCount, int salesCount, LocalDateTime createdAt) {
	}

	/** 후기 본문은 앞 120자. 작성자는 넣지 않는다. */
	public record ReviewRow(Long productId, int rating, boolean photo, String excerpt, LocalDateTime at) {
	}
}
