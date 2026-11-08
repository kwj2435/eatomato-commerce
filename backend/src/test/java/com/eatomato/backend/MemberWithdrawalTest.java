package com.eatomato.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.eatomato.backend.auth.kakao.KakaoOAuthClient;
import com.eatomato.backend.auth.kakao.KakaoUser;
import com.jayway.jsonpath.JsonPath;

/** 회원 탈퇴. 카카오 서버 호출만 가짜로 바꾸고 나머지 흐름은 그대로 돈다. */
@SpringBootTest(properties = "app.kakao.rest-api-key=test-key")
@AutoConfigureMockMvc
@ActiveProfiles("local")
class MemberWithdrawalTest {

	private static final String REDIRECT = "http://localhost:3000/login/kakao/";
	private static final String SIGNUP_COUPON = "신규가입 2,000원 쿠폰";

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JdbcTemplate jdbc;

	@MockitoBean
	KakaoOAuthClient kakaoOAuthClient;

	/** 카카오 로그인(처음이면 가입). 응답 전체를 돌려준다. */
	private String kakaoLogin(String code, long kakaoId, String email) throws Exception {
		given(kakaoOAuthClient.fetchUser(code, REDIRECT)).willReturn(new KakaoUser(kakaoId, email, true));
		return mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"%s\",\"redirectUri\":\"%s\"}".formatted(code, REDIRECT)))
			.andExpect(status().isOk())
			.andReturn().getResponse().getContentAsString();
	}

	/** 응답의 member.id 는 아이디(문자열)라, 회원 번호는 DB 에서 찾는다. */
	private long memberIdByKakao(long kakaoId) {
		return jdbc.queryForObject("select id from member where kakao_id = ?", Long.class, kakaoId);
	}

	private static String bearer(String session) {
		return "Bearer " + JsonPath.read(session, "$.accessToken");
	}

	private String signup(String loginId) throws Exception {
		String body = mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"%s\",\"password\":\"password123\",\"email\":\"%s@example.com\",\"name\":\"회원\"}"
					.formatted(loginId, loginId)))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		return "Bearer " + JsonPath.read(body, "$.accessToken");
	}

	private String admin() throws Exception {
		String body = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"admin\",\"password\":\"admin1234\"}"))
			.andReturn().getResponse().getContentAsString();
		return "Bearer " + JsonPath.read(body, "$.accessToken");
	}

	private List<String> availableCoupons(String user, String name) throws Exception {
		String coupons = mockMvc.perform(get("/api/me/coupons").header(HttpHeaders.AUTHORIZATION, user))
			.andReturn().getResponse().getContentAsString();
		return JsonPath.read(coupons, "$[?(@.name=='%s' && @.status=='AVAILABLE')].id".formatted(name));
	}

	/** 상품 1개 주문(결제 대기 상태). */
	private String order(String user) throws Exception {
		mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"productId\":12,\"options\":{\"color\":\"cream\",\"type\":\"basic\"},\"quantity\":1}"))
			.andExpect(status().isOk());
		return mockMvc.perform(post("/api/orders").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"shipping":{"recipientName":"김토마","recipientPhone":"010-1234-5678","zipCode":"21986","roadAddress":"도로명 1"}}
					"""))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
	}

	@Test
	void 탈퇴하면_정보가_지워지고_로그인이_끊기며_다시_가입해도_가입쿠폰은_없다() throws Exception {
		String session = kakaoLogin("w-code-1", 7001L, "withdraw.me@example.com");
		String user = bearer(session);
		String refreshToken = JsonPath.read(session, "$.refreshToken");
		long memberId = memberIdByKakao(7001L);
		assertThat(availableCoupons(user, SIGNUP_COUPON)).hasSize(1);
		mockMvc.perform(put("/api/me/profile").header(HttpHeaders.AUTHORIZATION, user).contentType(MediaType.APPLICATION_JSON)
				.content("{\"nickname\":\"탈퇴예정\",\"zipCode\":\"21986\",\"roadAddress\":\"도로명 1\",\"detailAddress\":\"101호\","
					+ "\"agreeTerms\":true,\"agreePrivacy\":true,\"ageOver14\":true}"))
			.andExpect(status().isOk());

		mockMvc.perform(delete("/api/me").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isNoContent());

		// 남은 액세스 토큰·리프레시 토큰으로는 더 쓸 수 없다
		mockMvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isForbidden());
		mockMvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\":\"%s\"}".formatted(refreshToken)))
			.andExpect(status().isUnauthorized());

		// 개인정보는 지우고, 행은 주문 기록을 위해 남긴다
		Map<String, Object> row = jdbc.queryForMap(
			"select login_id, email, name, nickname, zip_code, kakao_id, enabled, withdrawn_at from member where id = ?", memberId);
		assertThat(row.get("login_id")).isEqualTo("withdrawn_" + memberId);
		assertThat(row.get("email")).isEqualTo("withdrawn_" + memberId + "@withdrawn.invalid");
		assertThat(row.get("name")).isEqualTo("탈퇴회원");
		assertThat(row.get("nickname")).isNull();
		assertThat(row.get("zip_code")).isNull();
		assertThat(row.get("kakao_id")).isNull();
		assertThat(row.get("enabled")).isEqualTo(false);
		assertThat(row.get("withdrawn_at")).isNotNull();
		// 식별값 원문은 남기지 않는다
		assertThat(jdbc.queryForObject("select count(*) from withdrawn_social_account where id_hash = '7001'", Integer.class)).isZero();

		// 같은 카카오 계정으로 다시 가입은 되지만 새 회원이고, 신규가입 쿠폰은 다시 주지 않는다
		String again = kakaoLogin("w-code-2", 7001L, "withdraw.me@example.com");
		assertThat(memberIdByKakao(7001L)).isNotEqualTo(memberId);
		assertThat(availableCoupons(bearer(again), SIGNUP_COUPON)).isEmpty();
	}

	@Test
	void 탈퇴한_회원의_후기는_남기고_작성자만_바꾼다() throws Exception {
		String user = signup("withdrawreview1");
		String admin = admin();
		String order = order(user);
		String orderNumber = JsonPath.read(order, "$.orderNumber");
		int total = JsonPath.read(order, "$.total");
		mockMvc.perform(post("/api/payments/confirm").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"orderNumber\":\"%s\",\"paymentKey\":\"mock-%s\",\"amount\":%d}".formatted(orderNumber, orderNumber, total)))
			.andExpect(status().isOk());
		mockMvc.perform(put("/api/admin/orders/" + orderNumber + "/tracking").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"courier\":\"CJ대한통운\",\"trackingNumber\":\"1234 5678 9012\"}"))
			.andExpect(status().isOk());
		for (String next : List.of("PREPARING", "SHIPPING", "DELIVERED")) {
			mockMvc.perform(patch("/api/admin/orders/" + orderNumber + "/status").header(HttpHeaders.AUTHORIZATION, admin)
					.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"%s\"}".formatted(next)))
				.andExpect(status().isOk());
		}
		String orderItemId = JsonPath.read(order, "$.items[0].id").toString();
		mockMvc.perform(multipart("/api/reviews").param("orderItemId", orderItemId).param("rating", "5")
				.param("content", "탈퇴 전에 남긴 후기").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isCreated());

		mockMvc.perform(delete("/api/me").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isNoContent());

		Map<String, Object> review = jdbc.queryForMap("select writer_name, content from review where content = '탈퇴 전에 남긴 후기'");
		assertThat(review.get("writer_name")).isEqualTo("탈퇴한 회원");
		// 주문 기록(받는 분 정보 포함)은 법정 보관 기간 동안 남는다
		assertThat(jdbc.queryForObject("select count(*) from orders where order_number = ?", Integer.class, orderNumber)).isOne();
	}

	@Test
	void 진행_중인_주문이_있으면_탈퇴할_수_없다() throws Exception {
		String user = signup("withdrawbusy1");
		order(user);
		mockMvc.perform(delete("/api/me").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("WITHDRAW_ORDER_IN_PROGRESS"));
		mockMvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isOk());
	}

	@Test
	void 관리자는_탈퇴할_수_없고_탈퇴한_회원은_관리자도_되살릴_수_없다() throws Exception {
		String admin = admin();
		mockMvc.perform(delete("/api/me").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("WITHDRAW_ADMIN"));

		String session = kakaoLogin("w-code-3", 7003L, "revive.me@example.com");
		long memberId = memberIdByKakao(7003L);
		mockMvc.perform(delete("/api/me").header(HttpHeaders.AUTHORIZATION, bearer(session)))
			.andExpect(status().isNoContent());
		mockMvc.perform(patch("/api/admin/members/" + memberId).header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":true}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("WITHDRAWN_MEMBER"));
	}
}
