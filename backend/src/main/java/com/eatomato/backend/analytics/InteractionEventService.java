package com.eatomato.backend.analytics;

import java.net.URI;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.analytics.InteractionEvent.Type;
import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.product.ProductRepository;

import lombok.RequiredArgsConstructor;

/**
 * 화면 안 행동을 기록한다. 검색 로봇은 건너뛰고, 맞지 않는 요청도 조용히 버린다(응답은 같다, 화면에 영향 없음).
 * 메인 섹션 클릭은 누른 주소가 상품 상세면 상품 id 도 같이 남긴다.
 */
@Service
@RequiredArgsConstructor
public class InteractionEventService {

	private static final Pattern BOT = Pattern.compile(
		"bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|yeti|daumoa|curl|wget|python|java/|okhttp",
		Pattern.CASE_INSENSITIVE);

	/** /products/{slug} — 카테고리일 수도 있어 상품 슬러그인지는 DB 로 확인한다. */
	private static final Pattern PRODUCT_PATH = Pattern.compile("^/products/([A-Za-z0-9_-]+)/?$");

	private static final int DETAIL_MAX = 100;

	private final InteractionEventRepository interactionEventRepository;
	private final ProductRepository productRepository;

	@Transactional
	public void record(InteractionEventRequest request, String userAgent) {
		if (userAgent == null || userAgent.isBlank() || BOT.matcher(userAgent).find()) {
			return;
		}
		Type type = request.type();
		String section = type.isSection() ? request.section() : null;
		if (type.isSection() && section == null) {
			return;
		}
		String detail = type == Type.SECTION_CLICK ? clickPath(request.detail()) : trim(request.detail());

		Long productId = null;
		if (type.isSection()) {
			if (detail != null) {
				Matcher m = PRODUCT_PATH.matcher(detail);
				productId = m.matches() ? productRepository.findIdBySlug(m.group(1)).orElse(null) : null;
			}
		} else {
			if (request.productId() == null || !productRepository.existsById(request.productId())) {
				return;
			}
			productId = request.productId();
		}

		interactionEventRepository.save(new InteractionEvent(request.visitorId().toLowerCase(Locale.ROOT),
			request.sessionId().toLowerCase(Locale.ROOT), type, section, request.itemIndex(), productId, detail,
			PageViewService.device(userAgent), Times.now()));
	}

	/** 누른 주소에서 경로만 남긴다(쿼리·해시·끝 / 제거). 다른 사이트 주소는 호스트+경로. */
	static String clickPath(String raw) {
		String value = trim(raw);
		if (value == null) {
			return null;
		}
		try {
			URI uri = URI.create(value);
			String path = uri.getPath() == null || uri.getPath().isEmpty() ? "/" : uri.getPath();
			if (path.length() > 1 && path.endsWith("/")) {
				path = path.substring(0, path.length() - 1);
			}
			String host = uri.getHost();
			boolean own = host == null || host.toLowerCase(Locale.ROOT).replaceFirst("^www\\.", "").equals("eatomato.kr");
			return trim(own ? path : host + path);
		} catch (IllegalArgumentException e) {
			return null;
		}
	}

	private static String trim(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		String t = value.trim();
		return t.length() > DETAIL_MAX ? t.substring(0, DETAIL_MAX) : t;
	}
}
