package com.eatomato.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.jayway.jsonpath.JsonPath;

/**
 * 쿠폰·적립금: 가입 쿠폰, 주문 적용·취소 반환, 배송완료 적립, 후기 적립, 전액 할인 주문, 관리자 쿠폰 발급.
 * 다른 테스트와 DB 를 공유하므로 전용 상품(12: airpods-dottie, 할인가 13,500원, 적립률 3%)만 주문에 쓴다.
 * 배송비 정책은 기본값(3,000원, 8만원 이상 무료)이다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class CouponPointFlowTest {

	private static final int PRICE = 13_500;
	private static final int SHIPPING = 3_000;

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JdbcTemplate jdbc;

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

	private ResultActions order(String user, String couponId, int usePoints) throws Exception {
		// 실패한 주문은 장바구니를 비우지 않으니, 매번 이 테스트 회원의 장바구니를 비우고 1개만 담는다.
		jdbc.update("delete from cart_item where member_id in (select id from member where login_id like 'couponflow%')");
		mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"productId\":12,\"options\":{\"color\":\"cream\",\"type\":\"basic\"},\"quantity\":1}"))
			.andExpect(status().isOk());
		return mockMvc.perform(post("/api/orders").header(HttpHeaders.AUTHORIZATION, user)
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
				{"shipping":{"recipientName":"김토마","recipientPhone":"010-1234-5678","zipCode":"21986","roadAddress":"도로명 1"},
				 "memberCouponId":%s,"usePoints":%d}
				""".formatted(couponId == null ? "null" : couponId, usePoints)));
	}

	private void confirm(String user, String order) throws Exception {
		String orderNumber = JsonPath.read(order, "$.orderNumber");
		int total = JsonPath.read(order, "$.total");
		mockMvc.perform(post("/api/payments/confirm").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"orderNumber\":\"%s\",\"paymentKey\":\"mock-%s\",\"amount\":%d}".formatted(orderNumber, orderNumber, total)))
			.andExpect(status().isOk());
	}

	private void adminStatus(String admin, String orderNumber, String next) throws Exception {
		mockMvc.perform(patch("/api/admin/orders/" + orderNumber + "/status").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"%s\"}".formatted(next)))
			.andExpect(status().isOk());
	}

	private String availableCouponId(String user, String name) throws Exception {
		String coupons = mockMvc.perform(get("/api/me/coupons").header(HttpHeaders.AUTHORIZATION, user))
			.andReturn().getResponse().getContentAsString();
		List<String> ids = JsonPath.read(coupons, "$[?(@.name=='%s' && @.status=='AVAILABLE')].id".formatted(name));
		return ids.isEmpty() ? null : ids.getFirst();
	}

	private int balance(String user) throws Exception {
		String points = mockMvc.perform(get("/api/me/points").header(HttpHeaders.AUTHORIZATION, user))
			.andReturn().getResponse().getContentAsString();
		return JsonPath.read(points, "$.balance");
	}

	@Test
	void 가입_쿠폰_사용_배송완료_적립_후기_적립_적립금_사용과_취소_반환() throws Exception {
		String user = signup("couponflow1");
		String admin = admin();

		// 가입하면 2,000원 쿠폰이 들어온다
		String signupCoupon = availableCouponId(user, "신규가입 2,000원 쿠폰");
		org.assertj.core.api.Assertions.assertThat(signupCoupon).isNotNull();

		// 쿠폰 사용 주문: 13,500 + 3,000 - 2,000
		String first = order(user, signupCoupon, 0)
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.couponDiscount").value(2000))
			.andExpect(jsonPath("$.total").value(PRICE + SHIPPING - 2000))
			.andReturn().getResponse().getContentAsString();
		mockMvc.perform(get("/api/me/coupons").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(jsonPath("$[0].status").value("USED"));
		// 같은 쿠폰은 다시 못 쓴다
		order(user, signupCoupon, 0).andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("COUPON_NOT_APPLICABLE"));

		confirm(user, first);
		String firstNumber = JsonPath.read(first, "$.orderNumber");
		adminStatus(admin, firstNumber, "SHIPPING");
		org.assertj.core.api.Assertions.assertThat(balance(user)).isZero();
		adminStatus(admin, firstNumber, "DELIVERED");
		// 배송완료 적립: 13,500 × 3% = 405
		org.assertj.core.api.Assertions.assertThat(balance(user)).isEqualTo(405);

		// 후기 적립(텍스트 200원)
		String orderItemId = JsonPath.read(first, "$.items[0].id");
		mockMvc.perform(multipart("/api/reviews").param("orderItemId", orderItemId).param("rating", "5")
				.param("content", "좋아요").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isCreated());
		org.assertj.core.api.Assertions.assertThat(balance(user)).isEqualTo(605);

		// 잔액보다 많이·결제 금액보다 많이는 못 쓴다
		order(user, null, 606).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("POINT_NOT_ENOUGH"));
		jdbc.update("update point_wallet set balance = 100000 where member_id = (select id from member where login_id = 'couponflow1')");
		order(user, null, PRICE + SHIPPING + 1).andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("POINT_EXCEEDS_TOTAL"));
		jdbc.update("update point_wallet set balance = 605 where member_id = (select id from member where login_id = 'couponflow1')");

		// 적립금 사용 → 결제 전 취소하면 돌려받는다
		String second = order(user, null, 605)
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.pointUsed").value(605))
			.andExpect(jsonPath("$.total").value(PRICE + SHIPPING - 605))
			.andReturn().getResponse().getContentAsString();
		org.assertj.core.api.Assertions.assertThat(balance(user)).isZero();
		mockMvc.perform(post("/api/orders/" + JsonPath.read(second, "$.orderNumber") + "/cancel")
				.header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isOk());
		org.assertj.core.api.Assertions.assertThat(balance(user)).isEqualTo(605);
		mockMvc.perform(get("/api/me/points").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(jsonPath("$.history[0].type").value("ORDER_REFUND"))
			.andExpect(jsonPath("$.history[0].amount").value(605));
	}

	@Test
	void 관리자_쿠폰_발급과_전액_할인_주문_취소() throws Exception {
		String user = signup("couponflow2");
		String admin = admin();

		// 정률 쿠폰: 10%, 최대 1,000원, 1만원 이상
		String percent = mockMvc.perform(post("/api/admin/coupons").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"name":"가을 10%","discountType":"PERCENT","discountValue":10,"maxDiscount":1000,"minOrderAmount":10000,"validDays":7}
					"""))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		String percentId = JsonPath.read(percent, "$.id");
		mockMvc.perform(post("/api/admin/coupons/" + percentId + "/issue").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"all\":false,\"loginIds\":[\"couponflow2\",\"nobody-x\"]}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.issued").value(1))
			.andExpect(jsonPath("$.notFound[0]").value("nobody-x"));
		// 같은 회원에게 다시 발급하면 건너뛴다
		mockMvc.perform(post("/api/admin/coupons/" + percentId + "/issue").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"all\":false,\"loginIds\":[\"couponflow2\"]}"))
			.andExpect(jsonPath("$.issued").value(0));

		// 13,500 × 10% = 1,350 → 최대 1,000
		String percentCoupon = availableCouponId(user, "가을 10%");
		order(user, percentCoupon, 0).andExpect(status().isCreated())
			.andExpect(jsonPath("$.couponDiscount").value(1000));

		// 상품 금액을 넘는 정액 쿠폰 + 배송비만큼 적립금 → 0원: 결제창 없이 바로 결제완료
		String big = mockMvc.perform(post("/api/admin/coupons").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"name":"전액 쿠폰","discountType":"FIXED","discountValue":100000,"minOrderAmount":0,"validUntil":"2099-12-31"}
					"""))
			.andReturn().getResponse().getContentAsString();
		mockMvc.perform(post("/api/admin/coupons/" + JsonPath.read(big, "$.id") + "/issue")
				.header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"all\":false,\"loginIds\":[\"couponflow2\"]}"))
			.andExpect(jsonPath("$.issued").value(1));
		jdbc.update("insert into point_wallet (member_id, balance) select id, 5000 from member where login_id = 'couponflow2'");

		String bigCoupon = availableCouponId(user, "전액 쿠폰");
		String free = order(user, bigCoupon, SHIPPING)
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.couponDiscount").value(PRICE))
			.andExpect(jsonPath("$.total").value(0))
			.andExpect(jsonPath("$.status").value("PAID"))
			.andReturn().getResponse().getContentAsString();
		org.assertj.core.api.Assertions.assertThat(balance(user)).isEqualTo(2000);

		// 취소하면 쿠폰·적립금 모두 돌아온다(PG 취소 없음)
		mockMvc.perform(post("/api/orders/" + JsonPath.read(free, "$.orderNumber") + "/cancel")
				.header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("CANCELLED"));
		org.assertj.core.api.Assertions.assertThat(balance(user)).isEqualTo(5000);
		org.assertj.core.api.Assertions.assertThat(availableCouponId(user, "전액 쿠폰")).isEqualTo(bigCoupon);

		// 발급 중지한 쿠폰은 새로 발급할 수 없다
		mockMvc.perform(patch("/api/admin/coupons/" + percentId).header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"active\":false}"))
			.andExpect(jsonPath("$.active").value(false));
		mockMvc.perform(post("/api/admin/coupons/" + percentId + "/issue").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"all\":true}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("COUPON_NOT_ISSUABLE"));
	}
}
