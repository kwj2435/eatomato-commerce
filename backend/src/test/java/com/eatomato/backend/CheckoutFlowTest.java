package com.eatomato.backend;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.eatomato.backend.order.OrderService;
import com.jayway.jsonpath.JsonPath;

/**
 * 주문서 → 결제 승인 → 결제완료 흐름, 재고, 취소, 상태 규칙, 배송비 정책, 추가 정보, 로그인 잠금.
 * 다른 테스트와 DB 를 공유하므로 전용 상품(8: tok-red-square, 9: card-wallet-slim)만 재고·주문에 쓴다.
 */
@SpringBootTest(properties = "app.payment.webhook-secret=test-webhook-secret")
@AutoConfigureMockMvc
@ActiveProfiles("local")
class CheckoutFlowTest {

	private static final String SHIPPING = """
		{"recipientName":"김토마","recipientPhone":"010-1234-5678","zipCode":"%s","roadAddress":"도로명 주소 1","detailAddress":"101호"}""";

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	OrderService orderService;

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

	private void addToCart(String token, long productId, int quantity) throws Exception {
		mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"productId\":%d,\"options\":{\"color\":\"cream\",\"type\":\"basic\"},\"quantity\":%d}"
					.formatted(productId, quantity)))
			.andExpect(status().isOk());
	}

	private String order(String token, String zipCode) throws Exception {
		return mockMvc.perform(post("/api/orders").header(HttpHeaders.AUTHORIZATION, token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"shipping\":" + SHIPPING.formatted(zipCode) + "}"))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
	}

	private org.springframework.test.web.servlet.ResultActions confirm(String token, String orderNumber, int amount)
		throws Exception {
		return mockMvc.perform(post("/api/payments/confirm").header(HttpHeaders.AUTHORIZATION, token)
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"orderNumber\":\"%s\",\"paymentKey\":\"mock-%s\",\"amount\":%d}".formatted(orderNumber, orderNumber, amount)));
	}

	private void setStock(String admin, long productId, Integer stock) throws Exception {
		mockMvc.perform(patch("/api/admin/products/" + productId + "/stock").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"stockQuantity\":" + stock + "}"))
			.andExpect(status().isOk());
	}

	private int stockOf(long productId) {
		return jdbc.queryForObject("select stock_quantity from product where id = ?", Integer.class, productId);
	}

	private int salesOf(long productId) {
		return jdbc.queryForObject("select sales_count from product where id = ?", Integer.class, productId);
	}

	@Test
	void 주문서_결제승인_취소와_재고() throws Exception {
		String admin = admin();
		setStock(admin, 8, 3);
		String user = signup("checkout1");
		int salesBefore = salesOf(8);

		addToCart(user, 8, 2);
		// 재고보다 많이 담을 수 없다
		mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"productId\":8,\"options\":{\"color\":\"cream\",\"type\":\"basic\"},\"quantity\":2}"))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("INSUFFICIENT_STOCK"));

		String order = order(user, "21986");
		String orderNumber = JsonPath.read(order, "$.orderNumber");
		int total = JsonPath.read(order, "$.total");
		org.assertj.core.api.Assertions.assertThat(stockOf(8)).isEqualTo(1); // 주문 시 선점
		org.assertj.core.api.Assertions.assertThat(JsonPath.<String>read(order, "$.status")).isEqualTo("PENDING_PAYMENT");
		// 결제 전에는 장바구니가 남아 있다
		mockMvc.perform(get("/api/cart").header(HttpHeaders.AUTHORIZATION, user)).andExpect(jsonPath("$.items", hasSize(1)));

		confirm(user, orderNumber, total + 1).andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("PAYMENT_AMOUNT_MISMATCH"));
		confirm(user, orderNumber, total).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PAID"));
		confirm(user, orderNumber, total).andExpect(status().isOk()); // 같은 결제 재요청은 그대로
		mockMvc.perform(get("/api/cart").header(HttpHeaders.AUTHORIZATION, user)).andExpect(jsonPath("$.items", hasSize(0)));
		org.assertj.core.api.Assertions.assertThat(salesOf(8)).isEqualTo(salesBefore + 2);

		// 결제완료 → 결제완료(관리자)·배송완료 같은 역·건너뛰기 전이는 막힌다
		mockMvc.perform(patch("/api/admin/orders/" + orderNumber + "/status").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"DELIVERED\"}"))
			.andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_ORDER_STATUS"));
		mockMvc.perform(get("/api/admin/orders").param("q", orderNumber).header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(jsonPath("$.content[0].shipping.recipientName").value("김토마"))
			.andExpect(jsonPath("$.content[0].payment.status").value("DONE"))
			.andExpect(jsonPath("$.content[0].nextStatuses", hasSize(2)));

		// 고객 취소 → 재고·판매량 복원
		mockMvc.perform(post("/api/orders/" + orderNumber + "/cancel").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"));
		org.assertj.core.api.Assertions.assertThat(stockOf(8)).isEqualTo(3);
		org.assertj.core.api.Assertions.assertThat(salesOf(8)).isEqualTo(salesBefore);
		mockMvc.perform(post("/api/orders/" + orderNumber + "/cancel").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isBadRequest());

		// 재고 0 이면 품절
		setStock(admin, 8, 0);
		mockMvc.perform(get("/api/products/tok-red-square")).andExpect(jsonPath("$.soldOut").value(true));
		mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"productId\":8,\"options\":{\"color\":\"cream\",\"type\":\"basic\"},\"quantity\":1}"))
			.andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("SOLD_OUT"));
		setStock(admin, 8, null);
	}

	@Test
	void 재고가_모자라면_주문이_통째로_거절된다() throws Exception {
		String admin = admin();
		String user = signup("checkout2");
		addToCart(user, 9, 2);
		setStock(admin, 9, 1); // 담은 뒤 재고가 줄었다
		mockMvc.perform(post("/api/orders").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON).content("{\"shipping\":" + SHIPPING.formatted("21986") + "}"))
			.andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("INSUFFICIENT_STOCK"));
		org.assertj.core.api.Assertions.assertThat(stockOf(9)).isEqualTo(1);
		setStock(admin, 9, null);
	}

	@Test
	void 결제대기_30분이_지나면_자동_취소되고_재고가_돌아온다() throws Exception {
		String admin = admin();
		setStock(admin, 9, 5);
		String user = signup("checkout3");
		addToCart(user, 9, 2);
		String orderNumber = JsonPath.read(order(user, "21986"), "$.orderNumber");
		org.assertj.core.api.Assertions.assertThat(stockOf(9)).isEqualTo(3);

		jdbc.update("update orders set ordered_at = ? where order_number = ?",
			java.time.LocalDateTime.now().minusMinutes(31), orderNumber);
		orderService.expireUnpaidOrders();

		mockMvc.perform(get("/api/orders/" + orderNumber).header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(jsonPath("$.status").value("CANCELLED"));
		org.assertj.core.api.Assertions.assertThat(stockOf(9)).isEqualTo(5);
		setStock(admin, 9, null);
	}

	@Test
	void 제주는_추가_배송비_배송비_정책은_관리자가_바꾼다() throws Exception {
		String admin = admin();
		String user = signup("checkout4");
		addToCart(user, 9, 1); // 19,000원 → 기본 배송비 3,000 + 제주 3,000
		String jeju = order(user, "63100");
		org.assertj.core.api.Assertions.assertThat(JsonPath.<Integer>read(jeju, "$.shippingFee")).isEqualTo(6000);
		mockMvc.perform(post("/api/orders/" + JsonPath.read(jeju, "$.orderNumber") + "/cancel")
			.header(HttpHeaders.AUTHORIZATION, user)).andExpect(status().isOk());

		mockMvc.perform(put("/api/admin/shipping-policy").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"baseFee\":2500,\"freeThreshold\":10000,\"remoteAreaFee\":4000}"))
			.andExpect(status().isOk());
		mockMvc.perform(get("/api/shipping-policy")).andExpect(jsonPath("$.freeThreshold").value(10000));
		mockMvc.perform(get("/api/cart").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(jsonPath("$.summary.shippingFee").value(0))
			.andExpect(jsonPath("$.shippingPolicy.standardFee").value(2500));
		// 원래대로
		mockMvc.perform(put("/api/admin/shipping-policy").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"baseFee\":3000,\"freeThreshold\":80000,\"remoteAreaFee\":3000}"))
			.andExpect(status().isOk());
	}

	@Test
	void 결제_설정은_MOCK_이면_클라이언트_키가_없다() throws Exception {
		String user = signup("checkout6");
		mockMvc.perform(get("/api/payments/config").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.provider").value("MOCK"))
			.andExpect(jsonPath("$.clientKey").doesNotExist());
	}

	@Test
	void 웹훅은_비밀값이_맞을_때만_받는다() throws Exception {
		String user = signup("checkout5");
		addToCart(user, 9, 1);
		String order = order(user, "21986");
		String orderNumber = JsonPath.read(order, "$.orderNumber");
		int total = JsonPath.read(order, "$.total");
		String body = "{\"orderNumber\":\"%s\",\"paymentKey\":\"pg-1\",\"status\":\"DONE\",\"amount\":%d}".formatted(orderNumber, total);

		mockMvc.perform(post("/api/payments/webhook").header("X-Payment-Webhook-Secret", "wrong")
				.contentType(MediaType.APPLICATION_JSON).content(body))
			.andExpect(status().isUnauthorized());
		mockMvc.perform(post("/api/payments/webhook").header("X-Payment-Webhook-Secret", "test-webhook-secret")
				.contentType(MediaType.APPLICATION_JSON).content(body))
			.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PAID"));
	}

	@Test
	void 가입_후_닉네임과_주소를_넣어야_추가정보가_완료된다() throws Exception {
		String user = signup("profile1");
		mockMvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(jsonPath("$.profileComplete").value(false));
		String profile = "{\"nickname\":\"%s\",\"zipCode\":\"21986\",\"roadAddress\":\"인천 연수구 송도문화로 28\",\"detailAddress\":\"101호\"}";
		mockMvc.perform(put("/api/me/profile").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON).content(profile.formatted("토마토러버")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.nickname").value("토마토러버"))
			.andExpect(jsonPath("$.profileComplete").value(true))
			.andExpect(jsonPath("$.address.zipCode").value("21986"));

		String other = signup("profile2");
		mockMvc.perform(put("/api/me/profile").header(HttpHeaders.AUTHORIZATION, other)
				.contentType(MediaType.APPLICATION_JSON).content(profile.formatted("토마토러버")))
			.andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("DUPLICATE_NICKNAME"));
		mockMvc.perform(put("/api/me/profile").header(HttpHeaders.AUTHORIZATION, other)
				.contentType(MediaType.APPLICATION_JSON).content(profile.formatted("a")))
			.andExpect(status().isBadRequest());
	}

	@Test
	void 같은_계정으로_5번_틀리면_맞는_비밀번호도_잠시_막힌다() throws Exception {
		signup("bruteforce1");
		for (int i = 0; i < 5; i++) {
			mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
					.content("{\"loginId\":\"bruteforce1\",\"password\":\"wrong-%d\"}".formatted(i)))
				.andExpect(status().isUnauthorized());
		}
		mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"bruteforce1\",\"password\":\"password123\"}"))
			.andExpect(status().isTooManyRequests())
			.andExpect(jsonPath("$.code").value("TOO_MANY_LOGIN_ATTEMPTS"));
		// 다른 계정은 영향 없음
		signup("bruteforce2");
		mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"bruteforce2\",\"password\":\"password123\"}"))
			.andExpect(status().isOk());
	}
}
