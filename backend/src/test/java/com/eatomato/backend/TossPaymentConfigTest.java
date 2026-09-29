package com.eatomato.backend;

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

/** PAYMENT_PROVIDER=toss 설정으로 뜨는지, 주문서에 결제위젯 클라이언트 키를 주는지. 토스 API 는 부르지 않는다. */
@SpringBootTest(properties = {
	"app.payment.provider=toss",
	"app.payment.toss-client-key=test_gck_dummy",
	"app.payment.toss-secret-key=test_gsk_dummy",
})
@AutoConfigureMockMvc
@ActiveProfiles("local")
class TossPaymentConfigTest {

	@Autowired
	MockMvc mockMvc;

	@Test
	void 토스_결제면_클라이언트_키를_준다() throws Exception {
		String body = mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"toss1\",\"password\":\"password123\",\"email\":\"toss1@example.com\",\"name\":\"회원\"}"))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		String token = "Bearer " + JsonPath.read(body, "$.accessToken");

		mockMvc.perform(get("/api/payments/config").header(HttpHeaders.AUTHORIZATION, token))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.provider").value("TOSS"))
			.andExpect(jsonPath("$.clientKey").value("test_gck_dummy"));
	}

	@Test
	void 토스_웹훅은_로그인_없이_받고_관심없는_이벤트는_무시한다() throws Exception {
		mockMvc.perform(post("/api/payments/toss/webhook").contentType(MediaType.APPLICATION_JSON)
				.content("{\"eventType\":\"DEPOSIT_CALLBACK\",\"data\":{\"paymentKey\":\"pk\"}}"))
			.andExpect(status().isOk());
	}
}
