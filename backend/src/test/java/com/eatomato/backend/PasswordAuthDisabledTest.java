package com.eatomato.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.eatomato.backend.member.MemberRepository;

/** 운영처럼 아이디·비밀번호 계정을 끄면 가입·로그인 API 가 거절하고, 첫 관리자 계정도 만들지 않는다. */
// 다른 테스트 컨텍스트가 같은 H2(mem:eatomato)에 관리자 계정을 만들어 둘 수 있어, 이 테스트는 따로 DB 를 쓴다.
@SpringBootTest(properties = {
	"app.password-auth-enabled=false",
	"spring.datasource.url=jdbc:h2:mem:password-auth-disabled;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1"
})
@AutoConfigureMockMvc
@ActiveProfiles("local")
class PasswordAuthDisabledTest {

	@Autowired
	MockMvc mockMvc;

	@Autowired
	MemberRepository memberRepository;

	@Test
	void 이메일_가입이_꺼져_있으면_거절() throws Exception {
		mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content("{\"password\":\"password123\",\"email\":\"nosignup@example.com\",\"name\":\"가입불가\"}"))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.code").value("EMAIL_SIGNUP_DISABLED"));
	}

	@Test
	void 비밀번호_로그인이_꺼져_있으면_거절() throws Exception {
		// local 프로필의 관리자 계정(admin / admin1234)으로도 들어올 수 없다.
		mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"admin\",\"password\":\"admin1234\"}"))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.code").value("PASSWORD_LOGIN_DISABLED"));
	}

	@Test
	void 비밀번호_계정이_꺼져_있으면_첫_관리자를_만들지_않는다() {
		assertThat(memberRepository.findByLoginId("admin")).isEmpty();
	}
}
