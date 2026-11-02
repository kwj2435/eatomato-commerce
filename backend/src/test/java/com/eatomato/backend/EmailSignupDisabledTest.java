package com.eatomato.backend;

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

/** 운영처럼 이메일 가입을 끄면 가입 API 가 거절한다. */
@SpringBootTest(properties = "app.email-signup-enabled=false")
@AutoConfigureMockMvc
@ActiveProfiles("local")
class EmailSignupDisabledTest {

	@Autowired
	MockMvc mockMvc;

	@Test
	void 이메일_가입이_꺼져_있으면_거절() throws Exception {
		mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content("{\"password\":\"password123\",\"email\":\"nosignup@example.com\",\"name\":\"가입불가\"}"))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.code").value("EMAIL_SIGNUP_DISABLED"));
	}
}
