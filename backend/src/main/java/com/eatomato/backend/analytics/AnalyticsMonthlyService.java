package com.eatomato.backend.analytics;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.TreeMap;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.analytics.PageView.PageType;
import com.eatomato.backend.global.time.Times;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 월별 방문·구매 합계. 끝난 달은 원본 기록이 지워지기 전에 analytics_monthly 로 옮겨 두고(snapshotClosedMonths),
 * 이번 달은 원본 기록에서 바로 센다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsMonthlyService {

	private final AnalyticsMonthlyRepository monthlyRepository;
	private final PageViewRepository pageViewRepository;
	private final AnalyticsEventRepository analyticsEventRepository;

	/**
	 * 원본 기록이 남아 있는 끝난 달 가운데 아직 저장하지 않은 달의 합계를 남긴다. 이미 저장한 달은 건너뛰어 여러 번 불러도 같다.
	 * 원본을 지우기 직전(PageViewService.cleanUp)에 부른다.
	 */
	@Transactional
	public int snapshotClosedMonths() {
		LocalDate first = pageViewRepository.firstViewDate();
		if (first == null) {
			return 0;
		}
		YearMonth oldest = YearMonth.from(first);
		YearMonth current = YearMonth.from(Times.now());
		LocalDateTime now = Times.now();
		int saved = 0;
		for (YearMonth month = oldest; month.isBefore(current); month = month.plusMonths(1)) {
			if (monthlyRepository.existsById(month.atDay(1))) {
				continue;
			}
			monthlyRepository.save(new AnalyticsMonthly(count(month, first), now));
			saved++;
		}
		if (saved > 0) {
			log.info("월별 방문 통계 저장: {}개월", saved);
		}
		return saved;
	}

	/**
	 * 오래된 달부터 이번 달까지. 저장된 달은 저장값을, 아직 저장 전인 달(이번 달, 막 끝난 달)은 원본에서 바로 센다.
	 */
	@Transactional(readOnly = true)
	public List<MonthlyStats> months() {
		TreeMap<YearMonth, MonthlyStats> stored = new TreeMap<>();
		for (AnalyticsMonthly row : monthlyRepository.findAllByOrderByMonthStartAsc()) {
			stored.put(YearMonth.from(row.getMonthStart()), row.toStats());
		}
		LocalDate first = pageViewRepository.firstViewDate();
		YearMonth rawFrom = first == null ? null : YearMonth.from(first);
		YearMonth current = YearMonth.from(Times.now());
		YearMonth start = rawFrom;
		if (!stored.isEmpty() && (start == null || stored.firstKey().isBefore(start))) {
			start = stored.firstKey();
		}
		List<MonthlyStats> result = new ArrayList<>();
		if (start == null) {
			return result;
		}
		for (YearMonth month = start; !month.isAfter(current); month = month.plusMonths(1)) {
			MonthlyStats saved = stored.get(month);
			// 저장 전인 달은 원본에서 센다. 원본이 없으면 그달은 방문이 없었던 것이다(지우기 전에 항상 저장하므로).
			result.add(saved != null ? saved : count(month, first));
		}
		return result;
	}

	/**
	 * 그달 [1일, 다음 달 1일) 의 합계. 가장 오래된 기록이 있는 달은 그 앞이 지워졌거나 기록 전이라 dataFrom 을 그 날로 둔다.
	 * 그 뒤의 달은 원본이 온전히 남아 있으므로 1일로 둔다(1일에 방문이 없었던 것과 구분).
	 *
	 * @param firstViewDate 남아 있는 가장 오래된 기록 날짜. 원본이 하나도 없으면 null.
	 */
	private MonthlyStats count(YearMonth month, LocalDate firstViewDate) {
		LocalDate start = month.atDay(1);
		LocalDateTime from = start.atStartOfDay();
		LocalDateTime to = month.plusMonths(1).atDay(1).atStartOfDay();
		LocalDate dataFrom = firstViewDate != null && YearMonth.from(firstViewDate).equals(month) ? firstViewDate : start;

		long[] totals = {0, 0, 0};
		List<Object[]> rows = pageViewRepository.totals(from, to);
		if (!rows.isEmpty()) {
			for (int i = 0; i < 3; i++) {
				totals[i] = num(rows.get(0)[i]);
			}
		}
		Object[] purchase = analyticsEventRepository.countAndSum(AnalyticsEvent.Type.PURCHASE.name(), from, to)
			.stream().findFirst().orElse(new Object[] {0L, 0L});
		return new MonthlyStats(start, dataFrom, totals[0], totals[1], totals[2],
			pageViewRepository.countSessionsByType(PageType.PRODUCT.name(), from, to),
			analyticsEventRepository.countSessions(AnalyticsEvent.Type.ADD_TO_CART.name(), from, to),
			pageViewRepository.countSessionsByType(PageType.CHECKOUT.name(), from, to),
			analyticsEventRepository.countSessions(AnalyticsEvent.Type.CHECKOUT_START.name(), from, to),
			analyticsEventRepository.countSessions(AnalyticsEvent.Type.PURCHASE.name(), from, to),
			num(purchase[0]),
			num(purchase[1]));
	}

	private static long num(Object value) {
		return value == null ? 0 : ((Number) value).longValue();
	}
}
