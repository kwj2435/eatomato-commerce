package com.eatomato.backend;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.eatomato.backend.auth.naver.NaverOAuthClient;
import com.eatomato.backend.auth.naver.NaverUser;

/** 네이버 로그인. 네이버 서버 호출(NaverOAuthClient)만 가짜로 바꾸고 나머지 흐름은 그대로 돈다. */
@SpringBootTest(properties = {"app.naver.client-id=test-id", "app.naver.client-secret=test-secret"})
@AutoConfigureMockMvc
@ActiveProfiles("local")
class NaverLoginTest {

	private static final String REDIRECT = "http://localhost:3000/login/naver/";

	@Autowired
	MockMvc mockMvc;

	@MockitoBean
	NaverOAuthClient naverOAuthClient;

	private String loginBody(String code) {
		return "{\"code\":\"%s\",\"state\":\"st\",\"redirectUri\":\"%s\"}".formatted(code, REDIRECT);
	}

	@Test
	void 인가_시작은_허용된_redirect_만_네이버로_보낸다() throws Exception {
		given(naverOAuthClient.authorizeUrl(eq(REDIRECT), anyString()))
			.willReturn("https://nid.naver.com/oauth2.0/authorize?client_id=test-id");
		mockMvc.perform(get("/api/auth/naver/authorize").param("redirectUri", REDIRECT).param("state", "abc"))
			.andExpect(status().isFound())
			.andExpect(header().string("Location", containsString("nid.naver.com")));

		mockMvc.perform(get("/api/auth/naver/authorize").param("redirectUri", "https://evil.example/cb").param("state", "abc"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("NAVER_INVALID_REDIRECT"));
	}

	@Test
	void 처음이면_이름_휴대전화와_함께_가입하고_다음부터는_같은_회원으로_로그인() throws Exception {
		given(naverOAuthClient.fetchUser("code-1", "st"))
			.willReturn(new NaverUser("naver-abc", "naver.new@example.com", "김토마", "010-1234-5678"));
		String first = mockMvc.perform(post("/api/auth/naver").contentType(MediaType.APPLICATION_JSON).content(loginBody("code-1")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.member.email").value("naver.new@example.com"))
			.andExpect(jsonPath("$.member.name").value("김토마"))
			.andExpect(jsonPath("$.member.phone.first").value("010"))
			.andExpect(jsonPath("$.member.phone.last").value("5678"))
			.andReturn().getResponse().getContentAsString();
		String memberId = com.jayway.jsonpath.JsonPath.read(first, "$.member.id");

		given(naverOAuthClient.fetchUser("code-2", "st"))
			.willReturn(new NaverUser("naver-abc", "changed@example.com", "김토마", null));
		mockMvc.perform(post("/api/auth/naver").contentType(MediaType.APPLICATION_JSON).content(loginBody("code-2")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.member.id").value(memberId));
	}

	@Test
	void 같은_이메일의_기존_회원이_있거나_이메일이_없으면_거절() throws Exception {
		mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content("{\"password\":\"password123\",\"email\":\"naverlink@example.com\",\"name\":\"기존회원\"}"))
			.andExpect(status().isCreated());
		given(naverOAuthClient.fetchUser("code-3", "st"))
			.willReturn(new NaverUser("naver-def", "naverlink@example.com", null, null));
		mockMvc.perform(post("/api/auth/naver").contentType(MediaType.APPLICATION_JSON).content(loginBody("code-3")))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("NAVER_EMAIL_ALREADY_REGISTERED"));

		given(naverOAuthClient.fetchUser("code-4", "st")).willReturn(new NaverUser("naver-ghi", null, null, null));
		mockMvc.perform(post("/api/auth/naver").contentType(MediaType.APPLICATION_JSON).content(loginBody("code-4")))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("NAVER_EMAIL_REQUIRED"));
	}
}
