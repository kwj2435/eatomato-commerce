package com.eatomato.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

/**
 * 마케팅 인사이트: 관리자 요청 → 워커 claim → 원자료 → complete → 관리자 조회.
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

	@Test
	void 워커_토큰이_없거나_틀리면_내부_API_는_404() throws Exception {
		mockMvc.perform(post("/internal/insights/runs/claim")).andExpect(status().isNotFound());
		mockMvc.perform(post("/internal/insights/runs/claim").header(TOKEN_HEADER, "wrong"))
			.andExpect(status().isNotFound());
		mockMvc.perform(get("/internal/insights/dataset").header(TOKEN_HEADER, TOKEN.toUpperCase()))
			.andExpect(status().isNotFound());
	}

	@Test
	void 요청_가져가기_원자료_결과_저장_흐름() throws Exception {
		String admin = login("admin", "admin1234");
		String user = signup("insight1");
		String orderNumber = paidOrder(user);

		// 관리자만 요청할 수 있다
		mockMvc.perform(post("/api/admin/insights/runs").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON).content("{}"))
			.andExpect(status().isForbidden());

		String created = mockMvc.perform(post("/api/admin/insights/runs").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"question\":\"  인스타 게시물 중 구매로 이어진 건?  \"}"))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.status").value("PENDING"))
			.andExpect(jsonPath("$.question").value("인스타 게시물 중 구매로 이어진 건?"))
			.andReturn().getResponse().getContentAsString();
		Integer runId = JsonPath.read(created, "$.id");

		// 진행 중인 분석이 있으면 새로 요청할 수 없다
		mockMvc.perform(post("/api/admin/insights/runs").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{}"))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("INSIGHT_RUN_IN_PROGRESS"));

		// 워커가 가져가면 RUNNING, 더 가져갈 것은 없다
		mockMvc.perform(post("/internal/insights/runs/claim").header(TOKEN_HEADER, TOKEN))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(runId))
			.andExpect(jsonPath("$.question").value("인스타 게시물 중 구매로 이어진 건?"));
		mockMvc.perform(post("/internal/insights/runs/claim").header(TOKEN_HEADER, TOKEN))
			.andExpect(status().isNoContent());

		// 원자료: 주문은 있지만 주문번호·받는 분·연락처·주소는 없다. 회원은 해시로만 구분한다.
		String dataset = mockMvc.perform(get("/internal/insights/dataset").param("days", "7").header(TOKEN_HEADER, TOKEN))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.orders").isArray())
			.andExpect(jsonPath("$.products").isArray())
			.andExpect(jsonPath("$.pageViews").isArray())
			.andReturn().getResponse().getContentAsString();
		assertThat(dataset).doesNotContain(orderNumber, "개인정보테스트", "01098765432", "비공개로", "insight1");
		java.util.List<String> buyers = JsonPath.read(dataset, "$.orders[?(@.guest == false)].buyer");
		assertThat(buyers).isNotEmpty().allMatch(b -> b.matches("[0-9a-f]{16}"));

		// 완료: DONE 인데 리포트가 없으면 거절
		mockMvc.perform(post("/internal/insights/runs/" + runId + "/complete").header(TOKEN_HEADER, TOKEN)
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"DONE\"}"))
			.andExpect(status().isBadRequest());
		mockMvc.perform(post("/internal/insights/runs/" + runId + "/complete").header(TOKEN_HEADER, TOKEN)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"status":"DONE","report":{"headline":"게시물 A 가 구매로 이어졌어요","insights":[]},
					 "trace":[{"tool":"campaign_funnel","ms":12}],"model":"claude-haiku-5-5",
					 "inputTokens":1200,"outputTokens":300,"toolCalls":1}
					"""))
			.andExpect(status().isNoContent());
		// 이미 끝난 실행은 다시 완료할 수 없다
		mockMvc.perform(post("/internal/insights/runs/" + runId + "/complete").header(TOKEN_HEADER, TOKEN)
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"FAILED\",\"error\":\"x\"}"))
			.andExpect(status().isConflict());

		// 관리자: 상세에는 리포트·기록이 JSON 그대로, 목록에는 본문이 없다
		mockMvc.perform(get("/api/admin/insights/runs/" + runId).header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("DONE"))
			.andExpect(jsonPath("$.report.headline").value("게시물 A 가 구매로 이어졌어요"))
			.andExpect(jsonPath("$.trace[0].tool").value("campaign_funnel"))
			.andExpect(jsonPath("$.model").value("claude-haiku-5-5"))
			.andExpect(jsonPath("$.toolCalls").value(1));
		mockMvc.perform(get("/api/admin/insights/runs").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(jsonPath("$[0].id").value(runId))
			.andExpect(jsonPath("$[0].report").doesNotExist());

		// 끝났으니 다시 요청할 수 있다(주간 리포트 = 질문 없음)
		mockMvc.perform(post("/api/admin/insights/runs").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{}"))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.question").doesNotExist());
		// 다음 테스트를 막지 않게 정리
		String next = mockMvc.perform(post("/internal/insights/runs/claim").header(TOKEN_HEADER, TOKEN))
			.andReturn().getResponse().getContentAsString();
		mockMvc.perform(post("/internal/insights/runs/" + JsonPath.read(next, "$.id") + "/complete")
				.header(TOKEN_HEADER, TOKEN).contentType(MediaType.APPLICATION_JSON)
				.content("{\"status\":\"FAILED\",\"error\":\"테스트 정리\"}"))
			.andExpect(status().isNoContent());
	}
}
