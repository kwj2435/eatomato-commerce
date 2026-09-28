package com.eatomato.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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

/** 리프레시 토큰 교체·폐기와 정지 회원 차단. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class TokenRefreshTest {

	@Autowired
	MockMvc mockMvc;

	private String signup(String email) throws Exception {
		return mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content("{\"password\":\"password123\",\"email\":\"%s\",\"name\":\"회원\"}".formatted(email)))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.refreshToken").isNotEmpty())
			.andExpect(jsonPath("$.expiresIn").value(1800))
			.andReturn().getResponse().getContentAsString();
	}

	private String refresh(String refreshToken, int expectedStatus) throws Exception {
		return mockMvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\":\"%s\"}".formatted(refreshToken)))
			.andExpect(status().is(expectedStatus))
			.andReturn().getResponse().getContentAsString();
	}

	@Test
	void 리프레시하면_새_토큰을_받고_쓴_토큰은_다시_못_쓴다() throws Exception {
		String session = signup("refresh1@example.com");
		String firstRefresh = JsonPath.read(session, "$.refreshToken");

		String renewed = refresh(firstRefresh, 200);
		String newAccess = JsonPath.read(renewed, "$.accessToken");
		String newRefresh = JsonPath.read(renewed, "$.refreshToken");
		mockMvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + newAccess))
			.andExpect(status().isOk());

		refresh(firstRefresh, 401);
		refresh(newRefresh, 200);
	}

	@Test
	void 로그아웃하면_리프레시_토큰이_폐기된다() throws Exception {
		String refreshToken = JsonPath.read(signup("logout1@example.com"), "$.refreshToken");
		mockMvc.perform(post("/api/auth/logout").contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\":\"%s\"}".formatted(refreshToken)))
			.andExpect(status().isNoContent());
		refresh(refreshToken, 401);
		// 모르는 토큰으로 로그아웃해도 204
		mockMvc.perform(post("/api/auth/logout").contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\":\"unknown\"}"))
			.andExpect(status().isNoContent());
	}

	@Test
	void 정지된_회원은_남은_액세스_토큰으로도_못_쓰고_리프레시도_막힌다() throws Exception {
		String session = signup("suspend1@example.com");
		String access = "Bearer " + JsonPath.read(session, "$.accessToken");
		String refreshToken = JsonPath.read(session, "$.refreshToken");

		String admin = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"admin\",\"password\":\"admin1234\"}"))
			.andReturn().getResponse().getContentAsString();
		String adminToken = "Bearer " + JsonPath.read(admin, "$.accessToken");
		String list = mockMvc.perform(get("/api/admin/members").param("q", "suspend1")
				.header(HttpHeaders.AUTHORIZATION, adminToken))
			.andReturn().getResponse().getContentAsString();
		String memberId = JsonPath.read(list, "$.content[0].id");
		mockMvc.perform(patch("/api/admin/members/" + memberId).header(HttpHeaders.AUTHORIZATION, adminToken)
				.contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":false}"))
			.andExpect(status().isOk());

		mockMvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, access))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.code").value("MEMBER_DISABLED"));
		refresh(refreshToken, 401);
	}
}
