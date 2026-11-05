package com.eatomato.backend.admin.analytics;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.admin.analytics.AnalyticsResponse.Daily;
import com.eatomato.backend.admin.analytics.AnalyticsResponse.Hourly;
import com.eatomato.backend.admin.analytics.AnalyticsResponse.Source;
import com.eatomato.backend.admin.analytics.AnalyticsResponse.TopPage;
import com.eatomato.backend.admin.analytics.AnalyticsResponse.TopProduct;
import com.eatomato.backend.admin.analytics.AnalyticsResponse.Totals;
import com.eatomato.backend.analytics.PageViewRepository;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.order.OrderItemRepository;
import com.eatomato.backend.product.Product;
import com.eatomato.backend.product.ProductRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminAnalyticsService {

	private static final int MAX_DAYS = 90;
	private static final int TOP = 10;

	private final PageViewRepository pageViewRepository;
	private final ProductRepository productRepository;
	private final OrderItemRepository orderItemRepository;

	public AnalyticsResponse get(int days) {
		if (days < 1 || days > MAX_DAYS) {
			throw new ApiException(ErrorCode.INVALID_REQUEST);
		}
		LocalDateTime now = Times.now();
		LocalDate today = now.toLocalDate();
		LocalDate rangeFrom = today.minusDays(days - 1);
		LocalDateTime from = rangeFrom.atStartOfDay();
		LocalDateTime end = now.plusSeconds(1);

		Map<LocalDate, Daily> byDay = new LinkedHashMap<>();
		for (int i = 0; i < days; i++) {
			LocalDate day = rangeFrom.plusDays(i);
			byDay.put(day, new Daily(day, 0, 0, 0));
		}
		for (Object[] row : pageViewRepository.daily(rangeFrom)) {
			LocalDate day = (LocalDate) row[0];
			byDay.computeIfPresent(day, (d, empty) -> new Daily(d, num(row[1]), num(row[2]), num(row[3])));
		}

		Map<Integer, Hourly> byHour = new LinkedHashMap<>();
		for (int h = 0; h < 24; h++) {
			byHour.put(h, new Hourly(h, 0, 0));
		}
		for (Object[] row : pageViewRepository.hourly(today)) {
			int hour = (int) num(row[0]);
			byHour.computeIfPresent(hour, (h, empty) -> new Hourly(h, num(row[1]), num(row[2])));
		}

		return new AnalyticsResponse(
			days,
			totals(today.atStartOfDay(), end),
			totals(today.minusDays(1).atStartOfDay(), now.minusDays(1)),
			totals(from, end),
			pageViewRepository.countVisitorsSince(now.minusMinutes(5)),
			new ArrayList<>(byDay.values()),
			new ArrayList<>(byHour.values()),
			topPages(from),
			topProducts(from),
			sources(pageViewRepository.referrers(from)),
			sources(pageViewRepository.devices(from)));
	}

	private Totals totals(LocalDateTime from, LocalDateTime to) {
		List<Object[]> rows = pageViewRepository.totals(from, to);
		if (rows.isEmpty()) {
			return new Totals(0, 0, 0);
		}
		Object[] row = rows.get(0);
		return new Totals(num(row[0]), num(row[1]), num(row[2]));
	}

	private List<TopPage> topPages(LocalDateTime from) {
		List<Object[]> rows = pageViewRepository.topPages(from, PageRequest.of(0, TOP));
		List<Long> productIds = rows.stream().map(row -> (Long) row[2]).filter(id -> id != null).toList();
		Map<Long, Product> products = productsById(productIds);
		return rows.stream()
			.map(row -> {
				Product product = row[2] == null ? null : products.get((Long) row[2]);
				return new TopPage((String) row[0], (String) row[1], product == null ? null : product.getName(),
					num(row[3]), num(row[4]));
			})
			.toList();
	}

	private List<TopProduct> topProducts(LocalDateTime from) {
		List<Object[]> rows = pageViewRepository.topProducts(from, PageRequest.of(0, TOP));
		List<Long> ids = rows.stream().map(row -> (Long) row[0]).toList();
		if (ids.isEmpty()) {
			return List.of();
		}
		Map<Long, Product> products = productsById(ids);
		Map<Long, Long> purchased = new HashMap<>();
		for (Object[] row : orderItemRepository.paidQuantitiesSince(from, ids)) {
			purchased.put((Long) row[0], num(row[1]));
		}
		List<TopProduct> result = new ArrayList<>();
		for (Object[] row : rows) {
			Long id = (Long) row[0];
			Product product = products.get(id);
			if (product == null) {
				continue; // 그 사이 지워진 상품
			}
			result.add(new TopProduct(String.valueOf(id), product.getSlug(), product.getName(), product.getImageUrl(),
				num(row[1]), num(row[2]), purchased.getOrDefault(id, 0L)));
		}
		return result;
	}

	private Map<Long, Product> productsById(List<Long> ids) {
		if (ids.isEmpty()) {
			return Map.of();
		}
		return productRepository.findAllById(ids).stream()
			.collect(Collectors.toMap(Product::getId, Function.identity()));
	}

	private static List<Source> sources(List<Object[]> rows) {
		return rows.stream()
			.map(row -> new Source((String) row[0], num(row[1])))
			.sorted((a, b) -> Long.compare(b.count(), a.count()))
			.toList();
	}

	private static long num(Object value) {
		return value == null ? 0 : ((Number) value).longValue();
	}
}
