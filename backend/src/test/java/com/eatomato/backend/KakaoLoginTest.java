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

import com.eatomato.backend.auth.kakao.KakaoOAuthClient;
import com.eatomato.backend.auth.kakao.KakaoUser;

/** 카카오 로그인. 카카오 서버 호출(KakaoOAuthClient)만 가짜로 바꾸고 나머지 흐름은 그대로 돈다. */
@SpringBootTest(properties = "app.kakao.rest-api-key=test-key")
@AutoConfigureMockMvc
@ActiveProfiles("local")
class KakaoLoginTest {

	private static final String REDIRECT = "http://localhost:3000/login/kakao/";

	@Autowired
	MockMvc mockMvc;

	@MockitoBean
	KakaoOAuthClient kakaoOAuthClient;

	private String loginBody(String code) {
		return "{\"code\":\"%s\",\"redirectUri\":\"%s\"}".formatted(code, REDIRECT);
	}

	@Test
	void 인가_시작은_허용된_redirect_만_카카오로_보낸다() throws Exception {
		given(kakaoOAuthClient.authorizeUrl(eq(REDIRECT), anyString()))
			.willReturn("https://kauth.kakao.com/oauth/authorize?client_id=test-key");
		mockMvc.perform(get("/api/auth/kakao/authorize").param("redirectUri", REDIRECT).param("state", "abc"))
			.andExpect(status().isFound())
			.andExpect(header().string("Location", containsString("kauth.kakao.com")));

		mockMvc.perform(get("/api/auth/kakao/authorize").param("redirectUri", "https://evil.example/cb").param("state", "abc"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("KAKAO_INVALID_REDIRECT"));
	}

	@Test
	void 처음이면_가입하고_다음부터는_같은_회원으로_로그인() throws Exception {
		given(kakaoOAuthClient.fetchUser("code-1", REDIRECT)).willReturn(new KakaoUser(1001L, "kakao.new@example.com", true));
		String first = mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(loginBody("code-1")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.member.email").value("kakao.new@example.com"))
			.andReturn().getResponse().getContentAsString();
		String loginId = com.jayway.jsonpath.JsonPath.read(first, "$.member.id");

		// 카카오 쪽 이메일이 바뀌어도 회원번호로 같은 회원을 찾는다
		given(kakaoOAuthClient.fetchUser("code-2", REDIRECT)).willReturn(new KakaoUser(1001L, "changed@example.com", true));
		mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(loginBody("code-2")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.member.id").value(loginId));
	}

	@Test
	void 같은_이메일의_기존_회원에_자동으로_연결() throws Exception {
		mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content("{\"password\":\"password123\",\"email\":\"linkme@example.com\",\"name\":\"기존회원\"}"))
			.andExpect(status().isCreated());
		given(kakaoOAuthClient.fetchUser("code-3", REDIRECT)).willReturn(new KakaoUser(2002L, "linkme@example.com", true));
		mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(loginBody("code-3")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.member.name").value("기존회원"));
	}

	@Test
	void 이메일_동의가_없거나_미인증이면_거절() throws Exception {
		given(kakaoOAuthClient.fetchUser("code-4", REDIRECT)).willReturn(new KakaoUser(3003L, null, false));
		mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(loginBody("code-4")))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("KAKAO_EMAIL_REQUIRED"));

		given(kakaoOAuthClient.fetchUser("code-5", REDIRECT)).willReturn(new KakaoUser(3004L, "linkme@example.com", false));
		mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(loginBody("code-5")))
			.andExpect(status().isBadRequest());
	}
}
