package com.eatomato.backend;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
import org.springframework.test.web.servlet.ResultActions;

import com.jayway.jsonpath.JsonPath;

/**
 * 비회원 장바구니 금액 계산 → 주문 → 결제 승인 → 조회·취소. 로그인 없이 주문번호 + 주문 비밀번호로 확인한다.
 * 재고를 바꾸는 다른 테스트와 겹치지 않게 재고를 관리하지 않는 상품(card-wallet-classic)을 쓴다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class GuestOrderFlowTest {

	private static final String LINE = """
		{"id":"g1","productId":%d,"options":{"color":"cream","type":"basic"},"quantity":%d,"selected":true}""";

	private static final String ORDER = """
		{"items":[%s],
		 "shipping":{"recipientName":"김비회","recipientPhone":"010-2222-3333","zipCode":"21986","roadAddress":"도로명 주소 1"},
		 "orderer":{"name":"김비회","phone":"010-2222-3333","email":"guest@example.com"},
		 "password":"%s","agreePrivacy":%s}""";

	@Autowired
	MockMvc mockMvc;

	private long productId() {
		return 10; // card-wallet-classic
	}

	private ResultActions placeOrder(String password, boolean agree) throws Exception {
		return mockMvc.perform(post("/api/guest/orders").contentType(MediaType.APPLICATION_JSON)
			.content(ORDER.formatted(LINE.formatted(productId(), 2), password, agree)));
	}

	private ResultActions lookup(String orderNumber, String password) throws Exception {
		return mockMvc.perform(post("/api/guest/orders/lookup").contentType(MediaType.APPLICATION_JSON)
			.content("{\"orderNumber\":\"%s\",\"password\":\"%s\"}".formatted(orderNumber, password)));
	}

	@Test
	void 장바구니_금액계산() throws Exception {
		String lines = LINE.formatted(productId(), 2) + ","
			+ "{\"id\":\"gone\",\"productId\":999999,\"options\":{},\"quantity\":1,\"selected\":true},"
			+ "{\"id\":\"bad-option\",\"productId\":" + productId() + ",\"options\":{\"color\":\"nope\"},\"quantity\":1,\"selected\":true}";
		mockMvc.perform(post("/api/guest/cart").contentType(MediaType.APPLICATION_JSON)
				.content("{\"items\":[" + lines + "]}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.items", hasSize(1)))
			.andExpect(jsonPath("$.items[0].id").value("g1"))
			.andExpect(jsonPath("$.items[0].quantity").value(2))
			.andExpect(jsonPath("$.summary.selectedCount").value(1));
	}

	@Test
	void 비회원_주문_결제_조회_취소() throws Exception {
		placeOrder("abcd1234", false).andExpect(status().isBadRequest());

		String body = placeOrder("abcd1234", true)
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.status").value("PENDING_PAYMENT"))
			.andExpect(jsonPath("$.couponDiscount").value(0))
			.andReturn().getResponse().getContentAsString();
		String orderNumber = JsonPath.read(body, "$.orderNumber");
		int total = JsonPath.read(body, "$.total");

		String confirm = "{\"orderNumber\":\"%s\",\"password\":\"%s\",\"paymentKey\":\"mock-%s\",\"amount\":%d}";
		mockMvc.perform(post("/api/guest/orders/confirm").contentType(MediaType.APPLICATION_JSON)
				.content(confirm.formatted(orderNumber, "wrong-pw", orderNumber, total)))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("GUEST_ORDER_NOT_FOUND"));
		mockMvc.perform(post("/api/guest/orders/confirm").contentType(MediaType.APPLICATION_JSON)
				.content(confirm.formatted(orderNumber, "abcd1234", orderNumber, total)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("PAID"));

		lookup(orderNumber, "abcd1234").andExpect(status().isOk())
			.andExpect(jsonPath("$.shipping.recipientName").value("김비회"))
			.andExpect(jsonPath("$.items", hasSize(1)));

		// 관리자 목록에는 비회원 주문자로 보인다
		String admin = JsonPath.read(mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"admin\",\"password\":\"admin1234\"}"))
			.andReturn().getResponse().getContentAsString(), "$.accessToken");
		mockMvc.perform(get("/api/admin/orders").param("q", orderNumber).header(HttpHeaders.AUTHORIZATION, "Bearer " + admin))
			.andExpect(jsonPath("$.content[0].guest.name").value("김비회"))
			.andExpect(jsonPath("$.content[0].guest.email").value("guest@example.com"));

		mockMvc.perform(post("/api/guest/orders/cancel").contentType(MediaType.APPLICATION_JSON)
				.content("{\"orderNumber\":\"%s\",\"password\":\"abcd1234\"}".formatted(orderNumber)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("CANCELLED"));
	}

	@Test
	void 배송완료_비회원은_적립없음() throws Exception {
		String body = placeOrder("pw-delivered", true).andReturn().getResponse().getContentAsString();
		String orderNumber = JsonPath.read(body, "$.orderNumber");
		int total = JsonPath.read(body, "$.total");
		mockMvc.perform(post("/api/guest/orders/confirm").contentType(MediaType.APPLICATION_JSON)
				.content("{\"orderNumber\":\"%s\",\"password\":\"pw-delivered\",\"paymentKey\":\"mock-%s\",\"amount\":%d}"
					.formatted(orderNumber, orderNumber, total)))
			.andExpect(status().isOk());
		String admin = "Bearer " + JsonPath.read(mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON).content("{\"loginId\":\"admin\",\"password\":\"admin1234\"}"))
			.andReturn().getResponse().getContentAsString(), "$.accessToken");
		for (String next : new String[] {"SHIPPING", "DELIVERED"}) {
			mockMvc.perform(patch("/api/admin/orders/" + orderNumber + "/status").header(HttpHeaders.AUTHORIZATION, admin)
					.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"" + next + "\"}"))
				.andExpect(status().isOk());
		}
		lookup(orderNumber, "pw-delivered").andExpect(jsonPath("$.status").value("DELIVERED"))
			.andExpect(jsonPath("$.pointsEarned").value(0));
	}

	@Test
	void 비밀번호를_여러번_틀리면_잠긴다() throws Exception {
		String body = placeOrder("right-pw", true).andReturn().getResponse().getContentAsString();
		String orderNumber = JsonPath.read(body, "$.orderNumber");
		for (int i = 0; i < 5; i++) {
			lookup(orderNumber, "wrong-pw").andExpect(status().isNotFound());
		}
		lookup(orderNumber, "right-pw").andExpect(status().isTooManyRequests());
	}
}
