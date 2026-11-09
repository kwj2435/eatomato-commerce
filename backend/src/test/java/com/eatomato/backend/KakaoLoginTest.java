package com.eatomato.backend;

import static org.assertj.core.api.Assertions.assertThat;
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
import com.eatomato.backend.member.Member;
import com.eatomato.backend.member.MemberRepository;

/** 카카오 로그인. 카카오 서버 호출(KakaoOAuthClient)만 가짜로 바꾸고 나머지 흐름은 그대로 돈다. */
@SpringBootTest(properties = "app.kakao.rest-api-key=test-key")
@AutoConfigureMockMvc
@ActiveProfiles("local")
class KakaoLoginTest {

	private static final String REDIRECT = "http://localhost:3000/login/kakao/";

	@Autowired
	MockMvc mockMvc;

	@Autowired
	MemberRepository memberRepository;

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
			.andExpect(jsonPath("$.member.loginProvider").value("kakao"))
			.andReturn().getResponse().getContentAsString();
		String loginId = com.jayway.jsonpath.JsonPath.read(first, "$.member.id");

		// 카카오 쪽 이메일이 바뀌어도 회원번호로 같은 회원을 찾는다
		given(kakaoOAuthClient.fetchUser("code-2", REDIRECT)).willReturn(new KakaoUser(1001L, "changed@example.com", true));
		mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(loginBody("code-2")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.member.id").value(loginId));
	}

	@Test
	void 같은_이메일의_기존_회원이_있으면_자동_연결하지_않고_거절() throws Exception {
		// 이메일 가입은 이메일 인증이 없어, 남이 먼저 그 이메일로 가입해 둔 계정일 수 있다.
		mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content("{\"password\":\"password123\",\"email\":\"linkme@example.com\",\"name\":\"기존회원\"}"))
			.andExpect(status().isCreated());
		given(kakaoOAuthClient.fetchUser("code-3", REDIRECT)).willReturn(new KakaoUser(2002L, "linkme@example.com", true));
		mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(loginBody("code-3")))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("KAKAO_EMAIL_ALREADY_REGISTERED"));
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

	@Test
	void 가입하면_휴대전화번호와_CI_해시를_저장하고_같은_CI로는_다시_가입할_수_없다() throws Exception {
		given(kakaoOAuthClient.fetchUser("code-6", REDIRECT))
			.willReturn(new KakaoUser(4001L, "ci.first@example.com", true, "010-2222-3333", "CI-SAME-PERSON"));
		mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(loginBody("code-6")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.member.phone.first").value("010"))
			.andExpect(jsonPath("$.member.phone.middle").value("2222"))
			.andExpect(jsonPath("$.member.phone.last").value("3333"));
		Member member = memberRepository.findByKakaoId(4001L).orElseThrow();
		assertThat(member.getCiHash()).isEqualTo(Member.hashCi("CI-SAME-PERSON")).isNotEqualTo("CI-SAME-PERSON");

		// 같은 사람이 다른 카카오 계정으로 가입하려 하면 거절
		given(kakaoOAuthClient.fetchUser("code-7", REDIRECT))
			.willReturn(new KakaoUser(4002L, "ci.second@example.com", true, "010-2222-3333", "CI-SAME-PERSON"));
		mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(loginBody("code-7")))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("KAKAO_CI_ALREADY_REGISTERED"));
		assertThat(memberRepository.findByKakaoId(4002L)).isEmpty();
	}

	@Test
	void 기존_회원은_비어_있는_번호와_CI만_채운다() throws Exception {
		given(kakaoOAuthClient.fetchUser("code-8", REDIRECT)).willReturn(new KakaoUser(5001L, "fill@example.com", true));
		mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(loginBody("code-8")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.member.phone.first").value(""));

		given(kakaoOAuthClient.fetchUser("code-9", REDIRECT))
			.willReturn(new KakaoUser(5001L, "fill@example.com", true, "010-4444-5555", "CI-FILL"));
		mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(loginBody("code-9")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.member.phone.middle").value("4444"));
		assertThat(memberRepository.findByKakaoId(5001L).orElseThrow().getCiHash()).isEqualTo(Member.hashCi("CI-FILL"));

		// 이미 번호가 있으면(마이페이지에서 고친 번호 등) 카카오 번호로 덮어쓰지 않는다
		given(kakaoOAuthClient.fetchUser("code-10", REDIRECT))
			.willReturn(new KakaoUser(5001L, "fill@example.com", true, "010-9999-9999", "CI-FILL"));
		mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(loginBody("code-10")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.member.phone.middle").value("4444"));
	}
}
