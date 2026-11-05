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
	void 형식이_틀린_요청은_400_이고_관리자_통계는_관리자만() throws Exception {
		mockMvc.perform(post("/api/analytics/pageview").contentType(MediaType.APPLICATION_JSON)
				.header(HttpHeaders.USER_AGENT, BROWSER)
				.content("{\"visitorId\":\"nope\",\"sessionId\":\"nope\",\"path\":\"/\",\"sessionStart\":true}"))
			.andExpect(status().isBadRequest());
		mockMvc.perform(get("/api/admin/analytics")).andExpect(status().isUnauthorized());
		mockMvc.perform(get("/api/admin/analytics").param("days", "365").header(HttpHeaders.AUTHORIZATION, admin()))
			.andExpect(status().isBadRequest());
	}
}
