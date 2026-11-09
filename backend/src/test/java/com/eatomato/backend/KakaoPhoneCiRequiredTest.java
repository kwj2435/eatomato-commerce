package com.eatomato.backend;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

/** 카카오 휴대전화번호·CI 필수(app.kakao.require-phone-and-ci=true). */
@SpringBootTest(properties = {"app.kakao.rest-api-key=test-key", "app.kakao.require-phone-and-ci=true"})
@AutoConfigureMockMvc
@ActiveProfiles("local")
class KakaoPhoneCiRequiredTest {

	private static final String REDIRECT = "http://localhost:3000/login/kakao/";

	@Autowired
	MockMvc mockMvc;

	@MockitoBean
	KakaoOAuthClient kakaoOAuthClient;

	private String loginBody(String code) {
		return "{\"code\":\"%s\",\"redirectUri\":\"%s\"}".formatted(code, REDIRECT);
	}

	@Test
	void 번호나_CI가_없으면_가입을_거절하고_둘_다_있으면_가입() throws Exception {
		given(kakaoOAuthClient.fetchUser("no-ci", REDIRECT))
			.willReturn(new KakaoUser(6001L, "req1@example.com", true, "010-1111-2222", null));
		mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(loginBody("no-ci")))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("KAKAO_PHONE_CI_REQUIRED"));

		given(kakaoOAuthClient.fetchUser("no-phone", REDIRECT))
			.willReturn(new KakaoUser(6002L, "req2@example.com", true, null, "CI-REQ-2"));
		mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(loginBody("no-phone")))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("KAKAO_PHONE_CI_REQUIRED"));

		given(kakaoOAuthClient.fetchUser("both", REDIRECT))
			.willReturn(new KakaoUser(6003L, "req3@example.com", true, "010-1111-3333", "CI-REQ-3"));
		mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(loginBody("both")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.member.phone.last").value("3333"));
	}
}
