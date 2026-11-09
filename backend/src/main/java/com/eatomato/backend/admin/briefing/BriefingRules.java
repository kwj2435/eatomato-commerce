package com.eatomato.backend.admin.briefing;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import com.eatomato.backend.admin.briefing.BriefingFacts.StockItem;
import com.eatomato.backend.admin.briefing.BriefingResponse.Item;
import com.eatomato.backend.admin.briefing.BriefingResponse.Level;

/**
 * 사실(BriefingFacts)을 할 일 목록으로 바꾸는 규칙. DB 를 보지 않는 순수 함수라 테스트가 쉽다.
 * 무엇이 급한지는 여기서 정한다(나중에 AI 요약을 붙여도 판정은 이 규칙을 따른다).
 */
final class BriefingRules {

	/** 결제 후 이 시간이 지나도록 상품 준비를 시작하지 않으면 긴급. */
	static final Duration PAID_URGENT_AFTER = Duration.ofHours(24);

	/** 재고가 이 개수 이하면 재고 부족(0 은 품절). */
	static final int LOW_STOCK = 3;

	/** 별점이 이 점수 이하인 후기를 알린다. */
	static final int LOW_RATING = 2;

	/** 이 기간 안에 들어온 후기만 본다(하루 한 번 보는 브리핑이라 주말을 넘겨도 놓치지 않게 이틀). */
	static final Duration REVIEW_LOOKBACK = Duration.ofHours(48);

	/** 입금 기한이 이 시간 안에 끝나는 무통장입금 주문을 알린다. */
	static final Duration DEPOSIT_DUE_WITHIN = Duration.ofHours(24);

	/** 상품별 재고 항목은 이 개수까지만 따로 보여주고 나머지는 한 줄로 묶는다. */
	static final int MAX_STOCK_ITEMS = 5;

	static final int MAX_REVIEW_ITEMS = 3;

	private static final String SHIPMENTS = "/admin/shipments";

	private BriefingRules() {
	}

	static List<Item> evaluate(BriefingFacts f) {
		List<Item> items = new ArrayList<>();

		if (f.paidWaiting() > 0) {
			Duration waited = f.oldestPaidAt() == null ? Duration.ZERO : Duration.between(f.oldestPaidAt(), f.now());
			boolean overdue = waited.compareTo(PAID_URGENT_AFTER) >= 0;
			items.add(new Item(overdue ? Level.URGENT : Level.WARNING, "PAID_WAITING",
				"결제완료 주문 %d건이 상품 준비를 기다려요".formatted(f.paidWaiting()),
				f.oldestPaidAt() == null ? null : "가장 오래된 주문은 " + waitedText(waited),
				SHIPMENTS));
		}
		if (f.preparingWithoutTracking() > 0) {
			items.add(new Item(Level.WARNING, "PREPARING_NO_TRACKING",
				"송장을 입력하지 않은 상품준비중 주문 %d건".formatted(f.preparingWithoutTracking()),
				"발송한 뒤 택배사·송장번호를 저장해 주세요", SHIPMENTS));
		}
		if (f.preparingWithTracking() > 0) {
			items.add(new Item(Level.INFO, "PREPARING_NOT_SHIPPED",
				"송장을 넣고 배송중으로 바꾸지 않은 주문 %d건".formatted(f.preparingWithTracking()),
				"발송했다면 배송중으로 바꿔 주세요. 고객에게는 배송중부터 송장이 보입니다", SHIPMENTS));
		}

		addStockItems(f.lowStock(), items);

		if (f.depositDueSoon() > 0) {
			items.add(new Item(Level.INFO, "DEPOSIT_DUE_SOON",
				"입금 기한이 %d시간 안에 끝나는 주문 %d건".formatted(DEPOSIT_DUE_WITHIN.toHours(), f.depositDueSoon()),
				"기한 안에 입금되지 않으면 자동 취소되고 재고가 돌아옵니다", "/admin/orders?status=AWAITING_DEPOSIT"));
		}

		f.lowReviews().stream().limit(MAX_REVIEW_ITEMS).forEach(review -> items.add(new Item(Level.WARNING, "LOW_REVIEW",
			"%s에 별점 %d점 후기가 달렸어요".formatted(review.productName(), review.rating()),
			review.excerpt().isEmpty() ? null : review.excerpt(), "/products/" + review.slug())));
		if (f.lowReviews().size() > MAX_REVIEW_ITEMS) {
			items.add(new Item(Level.INFO, "LOW_REVIEW_MORE",
				"그 밖에 별점 %d점 이하 후기 %d개".formatted(LOW_RATING, f.lowReviews().size() - MAX_REVIEW_ITEMS),
				null, null));
		}

		if (f.paidCancelsYesterday() > 0) {
			items.add(new Item(Level.INFO, "PAID_CANCELS",
				"어제 결제 후 취소(환불)된 주문 %d건".formatted(f.paidCancelsYesterday()),
				f.unpaidCancelsYesterday() > 0
					? "결제 전에 취소된 주문 %d건은 따로 셌어요".formatted(f.unpaidCancelsYesterday()) : null,
				"/admin/orders?status=CANCELLED"));
		}

		// 긴급 → 확인 → 참고. 같은 단계 안에서는 위에서 넣은 순서(정렬은 안정적)를 지킨다.
		items.sort(Comparator.comparing(Item::level));
		return items;
	}

	/** 품절·재고 부족. 빨리 떨어질 상품부터, 최근 7일 판매가 없으면 참고로 낮춘다. */
	private static void addStockItems(List<StockItem> lowStock, List<Item> items) {
		List<StockItem> sorted = lowStock.stream()
			.sorted(Comparator.comparingDouble(BriefingRules::daysLeft).thenComparing(StockItem::name))
			.toList();
		for (StockItem s : sorted.subList(0, Math.min(MAX_STOCK_ITEMS, sorted.size()))) {
			Level level = s.soldLast7Days() > 0 ? Level.WARNING : Level.INFO;
			String link = "/admin/products/edit?id=" + s.productId();
			if (s.stock() <= 0) {
				items.add(new Item(level, "SOLD_OUT", "%s 품절".formatted(s.name()),
					s.soldLast7Days() > 0 ? "최근 7일 %d개 팔렸어요".formatted(s.soldLast7Days()) : "최근 7일 판매 없음",
					link));
			} else {
				items.add(new Item(level, "LOW_STOCK", "%s 재고 %d개 남음".formatted(s.name(), s.stock()),
					s.soldLast7Days() > 0
						? "최근 7일 판매 속도면 약 %d일 뒤 품절돼요".formatted((long) Math.ceil(daysLeft(s)))
						: "최근 7일 판매 없음",
					link));
			}
		}
		if (sorted.size() > MAX_STOCK_ITEMS) {
			items.add(new Item(Level.INFO, "LOW_STOCK_MORE",
				"그 밖에 재고 %d개 이하 상품 %d개".formatted(LOW_STOCK, sorted.size() - MAX_STOCK_ITEMS),
				null, "/admin/products"));
		}
	}

	/** 지금 판매 속도로 품절까지 남은 날. 품절이면 0, 최근 판매가 없으면 무한대. */
	static double daysLeft(StockItem s) {
		if (s.stock() <= 0) {
			return 0;
		}
		if (s.soldLast7Days() <= 0) {
			return Double.POSITIVE_INFINITY;
		}
		return s.stock() / (s.soldLast7Days() / 7.0);
	}

	/** 결제 후 지난 시간. 1시간 미만 → "결제한 지 1시간이 안 됐어요", 2일 미만은 시간, 그 이상은 일 단위. */
	static String waitedText(Duration d) {
		long hours = d.toHours();
		if (hours < 1) {
			return "결제한 지 1시간이 안 됐어요";
		}
		return "결제 후 %s 지났어요".formatted(hours < 48 ? hours + "시간" : d.toDays() + "일");
	}
}
