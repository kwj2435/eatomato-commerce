package com.eatomato.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.insight.InsightRunService;
import com.jayway.jsonpath.JsonPath;

/**
 * 개선 제안: 실행 요청(관리자·매일 아침) → 워커 claim → 원자료·지난 제안 → complete(제안 저장) → 보드에서 상태 관리.
 * 워커 토큰은 local 프로필의 개발용 값(local-insight-agent-token)이다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class InsightFlowTest {

	private static final String TOKEN_HEADER = "X-Internal-Token";
	private static final String TOKEN = "local-insight-agent-token";

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	InsightRunService insightRunService;

	/** 이 테스트만 쓰는 표. 매일 아침 스케줄이 테스트 중에 만든 실행이 있어도 흐름이 꼬이지 않게 비운다. */
	@BeforeEach
	void clean() {
		jdbc.update("delete from insight_suggestion");
		jdbc.update("delete from insight_run");
	}

	private String login(String loginId, String password) throws Exception {
		String body = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"%s\",\"password\":\"%s\"}".formatted(loginId, password)))
			.andReturn().getResponse().getContentAsString();
		return "Bearer " + JsonPath.read(body, "$.accessToken");
	}

	private String signup(String loginId) throws Exception {
		String body = mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"%s\",\"password\":\"password123\",\"email\":\"%s@example.com\",\"name\":\"회원\"}"
					.formatted(loginId, loginId)))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		return "Bearer " + JsonPath.read(body, "$.accessToken");
	}

	/** 결제까지 마친 주문 하나. 받는 분 이름·전화번호가 원자료에 새지 않는지 보려고 눈에 띄는 값을 쓴다. */
	private String paidOrder(String user) throws Exception {
		mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"productId\":12,\"options\":{\"color\":\"cream\",\"type\":\"basic\"},\"quantity\":1}"))
			.andExpect(status().isOk());
		String order = mockMvc.perform(post("/api/orders").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"shipping\":{\"recipientName\":\"개인정보테스트\",\"recipientPhone\":\"010-9876-5432\","
					+ "\"zipCode\":\"21986\",\"roadAddress\":\"비공개로 28\"}}"))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		String orderNumber = JsonPath.read(order, "$.orderNumber");
		int total = JsonPath.read(order, "$.total");
		mockMvc.perform(post("/api/payments/confirm").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"orderNumber\":\"%s\",\"paymentKey\":\"mock-%s\",\"amount\":%d}".formatted(orderNumber, orderNumber, total)))
			.andExpect(status().isOk());
		return orderNumber;
	}

	private ResultActions internal(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request) throws Exception {
		return mockMvc.perform(request.header(TOKEN_HEADER, TOKEN));
	}

	private ResultActions complete(Object runId, String body) throws Exception {
		return internal(post("/internal/insights/runs/" + runId + "/complete")
			.contentType(MediaType.APPLICATION_JSON).content(body));
	}

	private static String suggestion(String category, String title) {
		return """
			{"category":"%s","title":"%s","problem":"문제","proposal":"제안","metric":"담기 비율 5%% 이상",
			 "evidence":[{"metric":"상품 조회 방문","value":"52회"}],"impact":"high","effort":"low","confidence":"medium",
			 "sample_note":""}""".formatted(category, title);
	}

	@Test
	void 워커_토큰이_없거나_틀리면_내부_API_는_404() throws Exception {
		mockMvc.perform(post("/internal/insights/runs/claim")).andExpect(status().isNotFound());
		mockMvc.perform(post("/internal/insights/runs/claim").header(TOKEN_HEADER, "wrong"))
			.andExpect(status().isNotFound());
		mockMvc.perform(get("/internal/insights/suggestions/context").header(TOKEN_HEADER, TOKEN.toUpperCase()))
			.andExpect(status().isNotFound());
	}

	@Test
	void 분석_요청부터_제안_저장과_상태_관리까지() throws Exception {
		String admin = login("admin", "admin1234");
		String user = signup("insight1");
		String orderNumber = paidOrder(user);

		// 관리자만 볼 수 있다
		mockMvc.perform(get("/api/admin/insights/suggestions").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isForbidden());

		String created = mockMvc.perform(post("/api/admin/insights/runs").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.kind").value("MANUAL"))
			.andExpect(jsonPath("$.status").value("PENDING"))
			.andReturn().getResponse().getContentAsString();
		Integer runId = JsonPath.read(created, "$.id");
		// 진행 중인 분석이 있으면 새로 요청할 수 없고, 아침 자동 분석도 만들지 않는다
		mockMvc.perform(post("/api/admin/insights/runs").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("INSIGHT_RUN_IN_PROGRESS"));
		assertThat(insightRunService.createDailyIfDue()).isEmpty();

		internal(post("/internal/insights/runs/claim"))
			.andExpect(status().isOk()).andExpect(jsonPath("$.id").value(runId)).andExpect(jsonPath("$.kind").value("MANUAL"));
		internal(post("/internal/insights/runs/claim")).andExpect(status().isNoContent());
		internal(get("/internal/insights/suggestions/context"))
			.andExpect(jsonPath("$.items", hasSize(0))).andExpect(jsonPath("$.followUpDue", hasSize(0)));

		// 원자료: 주문은 있지만 주문번호·받는 분·연락처·주소·아이디는 없다. 회원은 해시로만 구분한다.
		String dataset = internal(get("/internal/insights/dataset").param("days", "7"))
			.andExpect(status().isOk()).andExpect(jsonPath("$.orders").isArray())
			.andReturn().getResponse().getContentAsString();
		assertThat(dataset).doesNotContain(orderNumber, "개인정보테스트", "01098765432", "비공개로", "insight1");
		java.util.List<String> buyers = JsonPath.read(dataset, "$.orders[?(@.guest == false)].buyer");
		assertThat(buyers).isNotEmpty().allMatch(b -> b.matches("[0-9a-f]{16}"));

		// 결과: 형식이 틀린 제안(없는 분야)은 건너뛰고, 한 번에 3개까지만 받는다
		complete(runId, "{\"status\":\"DONE\"}").andExpect(status().isBadRequest());
		complete(runId, """
			{"status":"DONE","model":"claude-haiku-5-5","inputTokens":1200,"outputTokens":300,"toolCalls":2,
			 "trace":[{"tool":"overview","ms":12}],
			 "report":{"summary":"인스타 유입이 상품 페이지에서 멈춰요","period":"7일",
			   "suggestions":[%s,%s,%s,%s,%s],"reconfirmed":[],"follow_ups":[],"data_gaps":[]}}
			""".formatted(suggestion("design", "담기 버튼 안내"), suggestion("finance", "없는 분야"),
				suggestion("marketing", "게시물 링크를 상품으로"), suggestion("planning", "첫 구매 쿠폰"),
				suggestion("operations", "네 번째라 버려짐")))
			.andExpect(status().isNoContent());
		complete(runId, "{\"status\":\"FAILED\",\"error\":\"x\"}").andExpect(status().isConflict());

		String board = mockMvc.perform(get("/api/admin/insights/suggestions").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(jsonPath("$", hasSize(3)))
			.andExpect(jsonPath("$[*].status", org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("NEW"))))
			.andExpect(jsonPath("$[?(@.title == '담기 버튼 안내')].category").value(org.hamcrest.Matchers.contains("DESIGN")))
			.andExpect(jsonPath("$[?(@.title == '담기 버튼 안내')].evidence[0].value").value(org.hamcrest.Matchers.contains("52회")))
			.andReturn().getResponse().getContentAsString();
		assertThat(board).doesNotContain("없는 분야", "네 번째라 버려짐");
		Integer design = JsonPath.<java.util.List<Integer>>read(board, "$[?(@.title == '담기 버튼 안내')].id").get(0);
		Integer marketing = JsonPath.<java.util.List<Integer>>read(board, "$[?(@.title == '게시물 링크를 상품으로')].id").get(0);

		mockMvc.perform(get("/api/admin/insights/overview").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(jsonPath("$.latest.report.summary").value("인스타 유입이 상품 페이지에서 멈춰요"))
			.andExpect(jsonPath("$.latest.trace[0].tool").value("overview"))
			.andExpect(jsonPath("$.active").doesNotExist())
			.andExpect(jsonPath("$.counts.NEW").value(3));

		// 상태 관리: 채택, 완료
		mockMvc.perform(patch("/api/admin/insights/suggestions/" + design + "/status").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"ADOPTED\"}"))
			.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ADOPTED"));
		mockMvc.perform(patch("/api/admin/insights/suggestions/" + marketing + "/status").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"DONE\"}"))
			.andExpect(status().isOk()).andExpect(jsonPath("$.doneAt").exists());
		mockMvc.perform(patch("/api/admin/insights/suggestions/" + marketing + "/status").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"WHATEVER\"}"))
			.andExpect(status().isBadRequest());

		// 다음 날 아침 분석: 완료 8일이 지난 제안은 효과 확인 대상, 열린 제안은 다시 확인할 수 있다
		jdbc.update("update insight_suggestion set done_at = ? where id = ?", Times.now().minusDays(8), marketing);
		Long daily = insightRunService.createDailyIfDue().orElseThrow().getId();
		assertThat(insightRunService.createDailyIfDue()).isEmpty(); // 하루 한 번
		internal(post("/internal/insights/runs/claim")).andExpect(jsonPath("$.kind").value("DAILY"));
		internal(get("/internal/insights/suggestions/context"))
			.andExpect(jsonPath("$.items", hasSize(3)))
			.andExpect(jsonPath("$.followUpDue", hasSize(1)))
			.andExpect(jsonPath("$.followUpDue[0].id").value(marketing));
		complete(daily, """
			{"status":"DONE","report":{"summary":"새 제안 없음","period":"7일","suggestions":[],
			 "reconfirmed":[{"id":%d,"note":"오늘도 담기 0회"},{"id":%d,"note":"완료된 제안은 다시 확인하지 않는다"}],
			 "follow_ups":[{"id":%d,"verdict":"improved","summary":"캠페인 전환 0%% → 4%%","evidence":[]},
			               {"id":%d,"verdict":"improved","summary":"아직 완료되지 않은 제안은 무시"}],
			 "data_gaps":[]}}
			""".formatted(design, marketing, marketing, design))
			.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/admin/insights/suggestions").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(jsonPath("$", hasSize(3)))
			.andExpect(jsonPath("$[?(@.id == " + design + ")].reconfirmCount").value(org.hamcrest.Matchers.contains(1)))
			.andExpect(jsonPath("$[?(@.id == " + design + ")].reconfirmNote").value(org.hamcrest.Matchers.contains("오늘도 담기 0회")))
			// 완료되지 않은 제안의 효과 확인은 무시된다(응답에 followUp 이 없다)
			.andExpect(jsonPath("$[?(@.id == " + design + ")].followUp", hasSize(0)))
			.andExpect(jsonPath("$[?(@.id == " + marketing + ")].reconfirmCount").value(org.hamcrest.Matchers.contains(0)))
			.andExpect(jsonPath("$[?(@.id == " + marketing + ")].followUp.verdict").value(org.hamcrest.Matchers.contains("improved")));

		// 완료를 되돌리면 효과 확인 결과도 지운다
		mockMvc.perform(patch("/api/admin/insights/suggestions/" + marketing + "/status").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"ADOPTED\"}"))
			.andExpect(jsonPath("$.followUp").doesNotExist()).andExpect(jsonPath("$.doneAt").doesNotExist());
	}
}
