package com.eatomato.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

/** 페이지 조회 기록과 관리자 방문자 분석. 다른 테스트와 DB 를 공유하므로 전후 차이로 확인한다. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class AnalyticsFlowTest {

	private static final String BROWSER =
		"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JdbcTemplate jdbc;

	private void event(String visitor, String session, String type, String extra) throws Exception {
		String body = """
			{"visitorId":"%s","sessionId":"%s","type":"%s"%s}
			""".formatted(visitor, session, type, extra);
		mockMvc.perform(post("/api/analytics/event").contentType(MediaType.APPLICATION_JSON)
				.header(HttpHeaders.USER_AGENT, BROWSER).content(body))
			.andExpect(status().isNoContent());
	}

	private String signup(String loginId) throws Exception {
		String body = mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"%s\",\"password\":\"password123\",\"email\":\"%s@example.com\",\"name\":\"회원\"}"
					.formatted(loginId, loginId)))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		return "Bearer " + JsonPath.read(body, "$.accessToken");
	}

	private void view(String visitor, String session, String path, boolean start, String referrer, String userAgent)
		throws Exception {
		String body = """
			{"visitorId":"%s","sessionId":"%s","path":"%s","sessionStart":%s,"referrer":%s}
			""".formatted(visitor, session, path, start, referrer == null ? "null" : "\"" + referrer + "\"");
		mockMvc.perform(post("/api/analytics/pageview").contentType(MediaType.APPLICATION_JSON)
				.header(HttpHeaders.USER_AGENT, userAgent).content(body))
			.andExpect(status().isNoContent());
	}

	private String admin() throws Exception {
		String body = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"admin\",\"password\":\"admin1234\"}"))
			.andReturn().getResponse().getContentAsString();
		return "Bearer " + JsonPath.read(body, "$.accessToken");
	}

	private String analytics(String admin) throws Exception {
		return mockMvc.perform(get("/api/admin/analytics").param("days", "7").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(status().isOk())
			.andReturn().getResponse().getContentAsString();
	}

	private static long number(String json, String path) {
		return ((Number) JsonPath.read(json, path)).longValue();
	}

	@Test
	void 조회를_남기면_방문자_분석에_잡힌다() throws Exception {
		String admin = admin();
		String before = analytics(admin);

		String visitor = UUID.randomUUID().toString();
		String session = UUID.randomUUID().toString();
		view(visitor, session, "/", true, "https://m.search.naver.com/search.naver?query=eatomato", BROWSER);
		view(visitor, session, "/products/mellow-macsafe/", false, null, BROWSER);
		view(visitor, session, "/products/phone-case?sort=new", false, null, BROWSER);
		// 세지 않는 것: 검색 로봇, 관리자 화면
		view(UUID.randomUUID().toString(), UUID.randomUUID().toString(), "/", true, null, "Googlebot/2.1");
		view(visitor, session, "/admin/orders", false, null, BROWSER);

		String after = analytics(admin);
		assertThat(number(after, "$.today.pageViews") - number(before, "$.today.pageViews")).isEqualTo(3);
		assertThat(number(after, "$.today.visitors") - number(before, "$.today.visitors")).isEqualTo(1);
		assertThat(number(after, "$.today.sessions") - number(before, "$.today.sessions")).isEqualTo(1);
		assertThat(number(after, "$.liveVisitors")).isGreaterThanOrEqualTo(1);
		assertThat((List<?>) JsonPath.read(after, "$.daily")).hasSize(7);
		assertThat((List<?>) JsonPath.read(after, "$.hourlyToday")).hasSize(24);

		List<Map<String, Object>> products = JsonPath.read(after, "$.topProducts[?(@.slug == 'mellow-macsafe')]");
		assertThat(products).hasSize(1);
		List<Map<String, Object>> pages = JsonPath.read(after, "$.topPages[?(@.path == '/products/mellow-macsafe')]");
		assertThat(pages).singleElement().satisfies(page -> assertThat(page.get("pageType")).isEqualTo("PRODUCT"));
		List<Map<String, Object>> category = JsonPath.read(after, "$.topPages[?(@.path == '/products/phone-case')]");
		assertThat(category).singleElement().satisfies(page -> assertThat(page.get("pageType")).isEqualTo("CATEGORY"));

		List<Number> naver = JsonPath.read(after, "$.referrers[?(@.key == 'search.naver.com')].count");
		assertThat(naver).singleElement().satisfies(n -> assertThat(n.longValue()).isGreaterThanOrEqualTo(1));
		List<Number> mobile = JsonPath.read(after, "$.devices[?(@.key == 'MOBILE')].count");
		assertThat(mobile).singleElement().satisfies(n -> assertThat(n.longValue()).isGreaterThanOrEqualTo(1));
	}

	@Test
	void 캠페인과_구매_단계가_방문_단위로_집계된다() throws Exception {
		String admin = admin();
		String before = analytics(admin);
		long productId = jdbc.queryForObject("select id from product where slug = 'tok-cream-round'", Long.class);

		// 인스타 게시물 링크(?from=Post 1107!)로 들어와 상품을 보고 담고 결제까지 마친 방문
		String visitor = UUID.randomUUID().toString();
		String session = UUID.randomUUID().toString();
		mockMvc.perform(post("/api/analytics/pageview").contentType(MediaType.APPLICATION_JSON)
				.header(HttpHeaders.USER_AGENT, BROWSER)
				.content("""
					{"visitorId":"%s","sessionId":"%s","path":"/products/tok-cream-round","sessionStart":true,
					 "referrer":"https://l.instagram.com/","campaign":"Post 1107!"}
					""".formatted(visitor, session)))
			.andExpect(status().isNoContent());
		event(visitor, session, "ADD_TO_CART", ",\"productId\":%d,\"quantity\":2".formatted(productId));

		String user = signup("analytics1");
		mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"productId\":%d,\"options\":{\"color\":\"cream\",\"type\":\"basic\"},\"quantity\":1}"
					.formatted(productId)))
			.andExpect(status().isOk());
		String order = mockMvc.perform(post("/api/orders").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"shipping\":{\"recipientName\":\"김토마\",\"recipientPhone\":\"010-1234-5678\","
					+ "\"zipCode\":\"21986\",\"roadAddress\":\"도로명 주소 1\",\"detailAddress\":\"101호\"}}"))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		String orderNumber = JsonPath.read(order, "$.orderNumber");
		int total = JsonPath.read(order, "$.total");
		String orderRef = ",\"orderNumber\":\"%s\"".formatted(orderNumber);
		event(visitor, session, "CHECKOUT_START", orderRef);

		// 결제 전 PURCHASE 는 버린다(결제되지 않은 주문)
		event(visitor, session, "PURCHASE", orderRef);
		assertThat(number(analytics(admin), "$.funnel.purchases") - number(before, "$.funnel.purchases")).isZero();

		mockMvc.perform(post("/api/payments/confirm").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"orderNumber\":\"%s\",\"paymentKey\":\"mock-%s\",\"amount\":%d}"
					.formatted(orderNumber, orderNumber, total)))
			.andExpect(status().isOk());
		event(visitor, session, "PURCHASE", orderRef);
		event(visitor, session, "PURCHASE", orderRef); // 완료 화면 새로고침: 한 번만 센다
		// 없는 주문·없는 상품은 조용히 버린다
		event(visitor, session, "PURCHASE", ",\"orderNumber\":\"NOPE-1\"");
		event(visitor, session, "ADD_TO_CART", ",\"productId\":999999");

		String after = analytics(admin);
		assertThat(number(after, "$.funnel.cartSessions") - number(before, "$.funnel.cartSessions")).isEqualTo(1);
		assertThat(number(after, "$.funnel.checkoutStartSessions") - number(before, "$.funnel.checkoutStartSessions"))
			.isEqualTo(1);
		assertThat(number(after, "$.funnel.purchases") - number(before, "$.funnel.purchases")).isEqualTo(1);
		assertThat(number(after, "$.funnel.revenue") - number(before, "$.funnel.revenue")).isEqualTo(total);

		List<Map<String, Object>> campaign = JsonPath.read(after, "$.campaigns[?(@.campaign == 'post-1107')]");
		assertThat(campaign).singleElement().satisfies(c -> {
			assertThat(((Number) c.get("sessions")).longValue()).isGreaterThanOrEqualTo(1);
			assertThat(((Number) c.get("productSessions")).longValue()).isGreaterThanOrEqualTo(1);
			assertThat(((Number) c.get("cartSessions")).longValue()).isGreaterThanOrEqualTo(1);
			assertThat(((Number) c.get("purchaseSessions")).longValue()).isGreaterThanOrEqualTo(1);
			assertThat(((Number) c.get("revenue")).longValue()).isGreaterThanOrEqualTo(total);
		});
	}

	@Test
	void 형식이_틀린_요청은_400_이고_관리자_통계는_관리자만() throws Exception {
		mockMvc.perform(post("/api/analytics/pageview").contentType(MediaType.APPLICATION_JSON)
				.header(HttpHeaders.USER_AGENT, BROWSER)
				.content("{\"visitorId\":\"nope\",\"sessionId\":\"nope\",\"path\":\"/\",\"sessionStart\":true}"))
			.andExpect(status().isBadRequest());
		mockMvc.perform(get("/api/admin/analytics")).andExpect(status().isUnauthorized());
		mockMvc.perform(get("/api/admin/analytics").param("days", "365").header(HttpHeaders.AUTHORIZATION, admin()))
			.andExpect(status().isBadRequest());
	}

	private void interaction(String visitor, String session, String fields) throws Exception {
		mockMvc.perform(post("/api/analytics/interaction").contentType(MediaType.APPLICATION_JSON)
				.header(HttpHeaders.USER_AGENT, BROWSER)
				.content("{\"visitorId\":\"%s\",\"sessionId\":\"%s\",%s}".formatted(visitor, session, fields)))
			.andExpect(status().isNoContent());
	}

	private static long sectionValue(String json, String section, String field) {
		List<Number> values = JsonPath.read(json, "$.engagement.sections[?(@.section == '%s')].%s".formatted(section, field));
		return values.isEmpty() ? 0 : values.get(0).longValue();
	}

	@Test
	void 메인_섹션_노출_클릭과_상품_상세_행동이_집계된다() throws Exception {
		String admin = admin();
		String before = analytics(admin);
		long productId = jdbc.queryForObject("select id from product where slug = 'mellow-macsafe'", Long.class);

		String visitor = UUID.randomUUID().toString();
		String session = UUID.randomUUID().toString();
		view(visitor, session, "/", true, null, BROWSER);
		interaction(visitor, session, "\"type\":\"SECTION_VIEW\",\"section\":\"best-picks\"");
		interaction(visitor, session, "\"type\":\"SECTION_VIEW\",\"section\":\"whats-new\"");
		// 배너는 사이트 전체 주소로 들어 있다. 경로만 남기고 상품 슬러그면 상품 id 도 남긴다.
		interaction(visitor, session, "\"type\":\"SECTION_CLICK\",\"section\":\"best-picks\",\"itemIndex\":2,"
			+ "\"detail\":\"https://eatomato.kr/products/mellow-macsafe/?from=x\"");
		interaction(visitor, session, "\"type\":\"PRODUCT_OPTION\",\"productId\":%d,\"detail\":\"기종:아이폰 16 프로\""
			.formatted(productId));
		interaction(visitor, session, "\"type\":\"PRODUCT_REVIEW\",\"productId\":%d,\"detail\":\"photo\""
			.formatted(productId));
		// 세지 않는 것: 섹션 이름이 없는 섹션 행동, 없는 상품의 상세 행동, 검색 로봇
		interaction(visitor, session, "\"type\":\"SECTION_VIEW\"");
		interaction(visitor, session, "\"type\":\"PRODUCT_IMAGE\",\"productId\":99999999,\"itemIndex\":1");
		mockMvc.perform(post("/api/analytics/interaction").contentType(MediaType.APPLICATION_JSON)
				.header(HttpHeaders.USER_AGENT, "Googlebot/2.1")
				.content("{\"visitorId\":\"%s\",\"sessionId\":\"%s\",\"type\":\"SECTION_VIEW\",\"section\":\"hero\"}"
					.formatted(visitor, session)))
			.andExpect(status().isNoContent());

		Long clickedProduct = jdbc.queryForObject("select product_id from interaction_event where session_id = ? "
			+ "and event_type = 'SECTION_CLICK'", Long.class, session);
		assertThat(clickedProduct).isEqualTo(productId);
		assertThat(jdbc.queryForObject("select detail from interaction_event where session_id = ? "
			+ "and event_type = 'SECTION_CLICK'", String.class, session)).isEqualTo("/products/mellow-macsafe");

		String after = analytics(admin);
		assertThat(sectionValue(after, "best-picks", "viewSessions") - sectionValue(before, "best-picks", "viewSessions"))
			.isEqualTo(1);
		assertThat(sectionValue(after, "best-picks", "clickSessions") - sectionValue(before, "best-picks", "clickSessions"))
			.isEqualTo(1);
		assertThat(sectionValue(after, "whats-new", "clicks") - sectionValue(before, "whats-new", "clicks")).isZero();
		assertThat(sectionValue(after, "hero", "viewSessions") - sectionValue(before, "hero", "viewSessions")).isZero();
		// 메인 순서대로 6개 섹션이 늘 나온다.
		List<String> sections = JsonPath.read(after, "$.engagement.sections[*].section");
		assertThat(sections).startsWith("hero", "best-picks", "whats-new", "tomato-edit", "review", "special");
		List<Number> photo = JsonPath.read(after, "$.engagement.productActions[?(@.type == 'PRODUCT_REVIEW')].count");
		assertThat(photo).singleElement().satisfies(n -> assertThat(n.longValue()).isGreaterThanOrEqualTo(1));
		List<Number> imageActions = JsonPath.read(before, "$.engagement.productActions[?(@.type == 'PRODUCT_IMAGE')].count");
		List<Number> imageAfter = JsonPath.read(after, "$.engagement.productActions[?(@.type == 'PRODUCT_IMAGE')].count");
		assertThat(imageAfter).isEqualTo(imageActions);
		List<String> options = JsonPath.read(after, "$.engagement.topOptions[*].key");
		assertThat(options).contains("기종:아이폰 16 프로");
	}
}
