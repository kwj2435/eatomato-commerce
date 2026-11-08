package com.eatomato.backend.analytics;

import java.net.URI;
import java.time.Period;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.analytics.PageView.Device;
import com.eatomato.backend.analytics.PageView.PageType;
import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.product.ProductRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** 스토어 페이지 조회를 기록하고, 보관 기간(3개월)이 지난 기록을 지운다. */
@Slf4j
@Service
@RequiredArgsConstructor
public class PageViewService {

	/** 개인정보처리방침의 "웹사이트 방문(접속) 기록 3개월" 과 맞춘다. */
	public static final Period KEEP = Period.ofMonths(3);

	private static final Pattern BOT = Pattern.compile(
		"bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|yeti|daumoa|curl|wget|python|java/|okhttp",
		Pattern.CASE_INSENSITIVE);

	private final PageViewRepository pageViewRepository;
	private final AnalyticsEventRepository analyticsEventRepository;
	private final ProductRepository productRepository;

	/**
	 * 조회 한 건을 남긴다. 검색 로봇·관리자 화면·형식이 맞지 않는 주소는 조용히 건너뛴다(응답은 같다).
	 *
	 * @param ownHost 우리 사이트 호스트. 이 호스트에서 넘어온 것은 유입 경로가 아니라 직접 방문으로 본다.
	 */
	@Transactional
	public void record(PageViewRequest request, String userAgent, String ownHost) {
		if (userAgent == null || userAgent.isBlank() || BOT.matcher(userAgent).find()) {
			return;
		}
		String path = normalizePath(request.path());
		if (path == null || path.equals("/admin") || path.startsWith("/admin/")) {
			return;
		}

		PageType type = classify(path);
		Long productId = null;
		if (type == PageType.CATEGORY) {
			// /products/{x} 는 카테고리 또는 상품 상세다(프론트의 디스패치 라우트). 상품 슬러그면 상품으로 본다.
			String[] segments = path.substring(1).split("/");
			if (segments.length == 2) {
				productId = productRepository.findIdBySlug(segments[1]).orElse(null);
				if (productId != null) {
					type = PageType.PRODUCT;
				}
			}
		}

		String referrerHost = request.sessionStart() ? referrerHost(request.referrer(), ownHost) : null;
		String campaign = request.sessionStart() ? normalizeCampaign(request.campaign()) : null;
		pageViewRepository.save(new PageView(request.visitorId().toLowerCase(Locale.ROOT),
			request.sessionId().toLowerCase(Locale.ROOT), path, type, productId, request.sessionStart(), referrerHost,
			campaign, device(userAgent), Times.now()));
	}

	@Scheduled(cron = "0 50 4 * * *", zone = "Asia/Seoul")
	@Transactional
	public void cleanUp() {
		int deleted = pageViewRepository.deleteViewedBefore(Times.now().minus(KEEP));
		int events = analyticsEventRepository.deleteOccurredBefore(Times.now().minus(KEEP));
		log.info("방문 기록 정리: 페이지 조회 {}건, 구매 단계 이벤트 {}건", deleted, events);
	}

	/** 쿼리·해시를 떼고 끝의 / 를 없앤다(정적 export 는 /cart/ 처럼 끝에 / 가 붙는다). 형식이 이상하면 null. */
	static String normalizePath(String raw) {
		String path = raw.trim();
		int cut = indexOfAny(path, '?', '#');
		if (cut >= 0) {
			path = path.substring(0, cut);
		}
		if (!path.startsWith("/") || path.startsWith("//")) {
			return null;
		}
		while (path.length() > 1 && path.endsWith("/")) {
			path = path.substring(0, path.length() - 1);
		}
		return path.length() > 255 ? null : path;
	}

	private static final Pattern CAMPAIGN_ALLOWED = Pattern.compile("[^a-z0-9가-힣_.-]");

	/** "Post 1107!" → "post-1107". 소문자·숫자·한글·_.- 만 남기고 60자로 자른다. 비면 null. */
	static String normalizeCampaign(String raw) {
		if (raw == null) {
			return null;
		}
		String value = raw.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", "-");
		value = CAMPAIGN_ALLOWED.matcher(value).replaceAll("");
		if (value.isEmpty()) {
			return null;
		}
		return value.length() > 60 ? value.substring(0, 60) : value;
	}

	static PageType classify(String path) {
		if (path.equals("/")) {
			return PageType.HOME;
		}
		String first = path.substring(1).split("/")[0];
		return switch (first) {
			case "products" -> PageType.CATEGORY;
			case "search" -> PageType.SEARCH;
			case "cart" -> PageType.CART;
			case "checkout" -> PageType.CHECKOUT;
			case "mypage", "orders" -> PageType.MYPAGE;
			case "notice" -> PageType.NOTICE;
			case "login", "signup" -> PageType.LOGIN;
			default -> PageType.OTHER;
		};
	}

	/** 유입 호스트. www.·m. 은 떼어 같은 사이트로 모은다. 없거나 우리 사이트면 null(직접 방문). */
	static String referrerHost(String referrer, String ownHost) {
		if (referrer == null || referrer.isBlank()) {
			return null;
		}
		String host;
		try {
			host = URI.create(referrer.trim()).getHost();
		} catch (IllegalArgumentException e) {
			return null;
		}
		if (host == null) {
			return null;
		}
		host = host.toLowerCase(Locale.ROOT);
		if (ownHost != null && host.equalsIgnoreCase(ownHost)) {
			return null;
		}
		for (String prefix : new String[] {"www.", "m."}) {
			if (host.startsWith(prefix)) {
				host = host.substring(prefix.length());
			}
		}
		if (ownHost != null && host.equalsIgnoreCase(ownHost.replaceFirst("^www\\.", ""))) {
			return null;
		}
		return host.length() > 100 ? host.substring(0, 100) : host;
	}

	static Device device(String userAgent) {
		String ua = userAgent.toLowerCase(Locale.ROOT);
		if (ua.contains("ipad") || ua.contains("tablet") || (ua.contains("android") && !ua.contains("mobile"))) {
			return Device.TABLET;
		}
		if (ua.contains("mobi") || ua.contains("iphone") || ua.contains("android")) {
			return Device.MOBILE;
		}
		return Device.DESKTOP;
	}

	private static int indexOfAny(String text, char a, char b) {
		int i = text.indexOf(a);
		int j = text.indexOf(b);
		if (i < 0) {
			return j;
		}
		return j < 0 ? i : Math.min(i, j);
	}
}
