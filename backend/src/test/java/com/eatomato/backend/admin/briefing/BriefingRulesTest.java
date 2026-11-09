package com.eatomato.backend.admin.briefing;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;

import com.eatomato.backend.admin.briefing.BriefingFacts.Day;
import com.eatomato.backend.admin.briefing.BriefingFacts.ReviewItem;
import com.eatomato.backend.admin.briefing.BriefingFacts.StockItem;
import com.eatomato.backend.admin.briefing.BriefingResponse.Item;
import com.eatomato.backend.admin.briefing.BriefingResponse.Level;

class BriefingRulesTest {

	private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 9, 9, 0);
	private static final Day EMPTY_DAY = new Day(LocalDate.of(2026, 11, 8), 0, 0, 0);

	/** 아무 일도 없는 상태에서 필요한 값만 바꿔 쓴다. */
	private static BriefingFacts facts(long paidWaiting, LocalDateTime oldestPaidAt, long noTracking, long notShipped,
		long depositDueSoon, List<StockItem> stock, List<ReviewItem> reviews, long paidCancels, long unpaidCancels) {
		return new BriefingFacts(NOW, paidWaiting, oldestPaidAt, noTracking, notShipped, depositDueSoon, stock, reviews,
			paidCancels, unpaidCancels, EMPTY_DAY, EMPTY_DAY);
	}

	private static BriefingFacts quiet() {
		return facts(0, null, 0, 0, 0, List.of(), List.of(), 0, 0);
	}

	@Test
	void 처리할_일이_없으면_빈_목록() {
		assertThat(BriefingRules.evaluate(quiet())).isEmpty();
	}

	@Test
	void 결제_후_하루가_지나면_긴급_아니면_확인() {
		Item overdue = BriefingRules.evaluate(facts(3, NOW.minusHours(30), 0, 0, 0, List.of(), List.of(), 0, 0)).get(0);
		assertThat(overdue.level()).isEqualTo(Level.URGENT);
		assertThat(overdue.title()).isEqualTo("결제완료 주문 3건이 상품 준비를 기다려요");
		assertThat(overdue.detail()).isEqualTo("가장 오래된 주문은 결제 후 30시간 지났어요");
		assertThat(overdue.link()).isEqualTo("/admin/shipments");

		Item fresh = BriefingRules.evaluate(facts(1, NOW.minusMinutes(20), 0, 0, 0, List.of(), List.of(), 0, 0)).get(0);
		assertThat(fresh.level()).isEqualTo(Level.WARNING);
		assertThat(fresh.detail()).isEqualTo("가장 오래된 주문은 결제한 지 1시간이 안 됐어요");

		Item old = BriefingRules.evaluate(facts(1, NOW.minusDays(3), 0, 0, 0, List.of(), List.of(), 0, 0)).get(0);
		assertThat(old.detail()).isEqualTo("가장 오래된 주문은 결제 후 3일 지났어요");
	}

	@Test
	void 긴급_확인_참고_순서로_정렬된다() {
		List<Item> items = BriefingRules.evaluate(
			facts(2, NOW.minusHours(25), 1, 1, 1, List.of(), List.of(), 1, 0));
		assertThat(items).extracting(Item::kind).containsExactly(
			"PAID_WAITING", "PREPARING_NO_TRACKING", "PREPARING_NOT_SHIPPED", "DEPOSIT_DUE_SOON", "PAID_CANCELS");
		assertThat(items).extracting(Item::level).containsExactly(
			Level.URGENT, Level.WARNING, Level.INFO, Level.INFO, Level.INFO);
	}

	@Test
	void 재고는_빨리_떨어질_상품부터_판매가_없으면_참고() {
		List<Item> items = BriefingRules.evaluate(facts(0, null, 0, 0, 0, List.of(
			new StockItem(1, "느린 상품", 3, 0),
			new StockItem(2, "빠른 상품", 2, 7),
			new StockItem(3, "품절 상품", 0, 4)), List.of(), 0, 0));

		assertThat(items).extracting(Item::title).containsExactly("품절 상품 품절", "빠른 상품 재고 2개 남음", "느린 상품 재고 3개 남음");
		assertThat(items.get(0).detail()).isEqualTo("최근 7일 4개 팔렸어요");
		assertThat(items.get(0).link()).isEqualTo("/admin/products/edit?id=3");
		// 하루 1개씩 팔리니 2개 남으면 약 2일
		assertThat(items.get(1).detail()).isEqualTo("최근 7일 판매 속도면 약 2일 뒤 품절돼요");
		assertThat(items.get(1).level()).isEqualTo(Level.WARNING);
		assertThat(items.get(2).level()).isEqualTo(Level.INFO);
		assertThat(items.get(2).detail()).isEqualTo("최근 7일 판매 없음");
	}

	@Test
	void 재고_항목이_많으면_나머지는_한_줄로_묶는다() {
		List<StockItem> stock = IntStream.rangeClosed(1, 7).mapToObj(i -> new StockItem(i, "상품" + i, 1, 1)).toList();
		List<Item> items = BriefingRules.evaluate(facts(0, null, 0, 0, 0, stock, List.of(), 0, 0));
		assertThat(items).hasSize(BriefingRules.MAX_STOCK_ITEMS + 1);
		assertThat(items).last().extracting(Item::title).isEqualTo("그 밖에 재고 3개 이하 상품 2개");
	}

	@Test
	void 낮은_별점_후기는_세_개까지_나머지는_묶고_링크가_없다() {
		List<ReviewItem> reviews = IntStream.rangeClosed(1, 5)
			.mapToObj(i -> new ReviewItem("상품" + i, "slug-" + i, 1, i == 1 ? "" : "별로예요")).toList();
		List<Item> items = BriefingRules.evaluate(facts(0, null, 0, 0, 0, List.of(), reviews, 0, 0));

		assertThat(items).hasSize(4);
		assertThat(items.get(0).title()).isEqualTo("상품1에 별점 1점 후기가 달렸어요");
		assertThat(items.get(0).detail()).isNull(); // 본문이 비면 설명 없이
		assertThat(items.get(0).link()).isEqualTo("/products/slug-1");
		assertThat(items.get(3).title()).isEqualTo("그 밖에 별점 2점 이하 후기 2개");
		assertThat(items.get(3).link()).isNull();
	}

	@Test
	void 결제_전_취소만_있으면_알리지_않는다() {
		assertThat(BriefingRules.evaluate(facts(0, null, 0, 0, 0, List.of(), List.of(), 0, 5))).isEmpty();

		Item cancels = BriefingRules.evaluate(facts(0, null, 0, 0, 0, List.of(), List.of(), 2, 5)).get(0);
		assertThat(cancels.title()).isEqualTo("어제 결제 후 취소(환불)된 주문 2건");
		assertThat(cancels.detail()).isEqualTo("결제 전에 취소된 주문 5건은 따로 셌어요");
	}

	@Test
	void 후기_본문은_줄바꿈을_펴고_80자에서_자른다() {
		assertThat(AdminBriefingService.excerpt("배송이\n\n너무   늦어요")).isEqualTo("배송이 너무 늦어요");
		assertThat(AdminBriefingService.excerpt("가".repeat(100))).isEqualTo("가".repeat(80) + "…");
		assertThat(AdminBriefingService.excerpt(null)).isEmpty();
	}
}
