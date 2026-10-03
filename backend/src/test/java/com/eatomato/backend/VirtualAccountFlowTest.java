package com.eatomato.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.eatomato.backend.order.OrderService;
import com.eatomato.backend.payment.PaymentGateway;
import com.jayway.jsonpath.JsonPath;

/**
 * 무통장입금(가상계좌): 계좌 발급 → 입금대기 → 입금 웹훅 → 결제완료, 입금 전 취소, 입금 기한 만료, 입금 뒤 환불(환불 계좌).
 * 토스 API 대신 paymentKey 가 va- 로 시작하면 가상계좌를 발급하는 가짜 PG 를 쓴다.
 * 다른 테스트와 DB 를 공유하므로 전용 상품(10: card-wallet-classic)만 재고·주문에 쓴다.
 */
@SpringBootTest(properties = {
	"app.payment.provider=toss",
	"app.payment.toss-client-key=test_gck_dummy",
	"app.payment.toss-secret-key=test_gsk_dummy",
})
@AutoConfigureMockMvc
@ActiveProfiles("local")
class VirtualAccountFlowTest {

	private static final String SECRET = "deposit-secret";

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	OrderService orderService;

	@Autowired
	FakeGateway gateway;

	@TestConfiguration
	static class Config {

		@Bean
		@Primary
		FakeGateway fakeGateway() {
			return new FakeGateway();
		}
	}

	/** va- 로 시작하는 paymentKey 는 가상계좌 발급, 그 밖에는 카드 승인. 취소 요청을 기록한다. */
	static class FakeGateway implements PaymentGateway {

		final List<RefundAccount> cancels = new ArrayList<>();

		@Override
		public String provider() {
			return "TOSS";
		}

		@Override
		public PaymentApproval confirm(String paymentKey, String orderNumber, int amount) {
			if (!paymentKey.startsWith("va-")) {
				return PaymentApproval.paid(paymentKey, amount, "카드");
			}
			return new PaymentApproval(paymentKey, amount, "가상계좌", SECRET,
				new VirtualAccount("88", "56211105948400", "김토마", LocalDateTime.now().plusDays(7)));
		}

		@Override
		public void cancel(String paymentKey, int amount, String reason, RefundAccount refundAccount) {
			cancels.add(refundAccount);
		}
	}

	@BeforeEach
	void setUp() {
		jdbc.update("update product set stock_quantity = 5 where id = 10");
		gateway.cancels.clear();
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

	/** 장바구니에 상품 10 을 2개 담고 주문서 제출 → 무통장입금 승인까지. 주문번호를 돌려준다. */
	private String orderWithVirtualAccount(String user) throws Exception {
		mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"productId\":10,\"options\":{\"color\":\"cream\",\"type\":\"basic\"},\"quantity\":2}"))
			.andExpect(status().isOk());
		String order = mockMvc.perform(post("/api/orders").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"shipping":{"recipientName":"김토마","recipientPhone":"010-1234-5678","zipCode":"21986","roadAddress":"도로명 1"}}
					"""))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		String orderNumber = JsonPath.read(order, "$.orderNumber");
		int total = JsonPath.read(order, "$.total");

		mockMvc.perform(post("/api/payments/confirm").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"orderNumber\":\"%s\",\"paymentKey\":\"va-%s\",\"amount\":%d}".formatted(orderNumber, orderNumber, total)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("AWAITING_DEPOSIT"))
			.andExpect(jsonPath("$.cancellable").value(true))
			.andExpect(jsonPath("$.payment.method").value("가상계좌"))
			.andExpect(jsonPath("$.payment.virtualAccount.bankCode").value("88"))
			.andExpect(jsonPath("$.payment.virtualAccount.accountNumber").value("56211105948400"))
			.andExpect(jsonPath("$.payment.virtualAccount.dueAt").exists());
		return orderNumber;
	}

	private ResultActions depositWebhook(String orderNumber, String secret, String status) throws Exception {
		return mockMvc.perform(post("/api/payments/toss/webhook").contentType(MediaType.APPLICATION_JSON)
			.content("{\"createdAt\":\"2026-10-03T12:00:00.000000\",\"secret\":\"%s\",\"status\":\"%s\",\"transactionKey\":\"tx\",\"orderId\":\"%s\"}"
				.formatted(secret, status, orderNumber)));
	}

	private String statusOf(String orderNumber) {
		return jdbc.queryForObject("select status from orders where order_number = ?", String.class, orderNumber);
	}

	private int stockOf10() {
		return jdbc.queryForObject("select stock_quantity from product where id = 10", Integer.class);
	}

	@Test
	void 입금_웹훅이_오면_결제완료가_된다() throws Exception {
		String user = signup("vaflow1");
		String orderNumber = orderWithVirtualAccount(user);
		assertThat(stockOf10()).isEqualTo(3);
		// 계좌를 받은 시점에 장바구니는 비운다
		mockMvc.perform(get("/api/cart").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(jsonPath("$.items").isEmpty());

		depositWebhook(orderNumber, "wrong", "DONE").andExpect(status().isUnauthorized());
		assertThat(statusOf(orderNumber)).isEqualTo("AWAITING_DEPOSIT");

		depositWebhook(orderNumber, SECRET, "DONE").andExpect(status().isOk());
		assertThat(statusOf(orderNumber)).isEqualTo("PAID");
		// 재전송돼도 한 번만 처리
		depositWebhook(orderNumber, SECRET, "DONE").andExpect(status().isOk());

		// 입금까지 끝난 무통장입금 주문은 고객이 직접 취소할 수 없다(환불 계좌 필요 → 고객센터)
		mockMvc.perform(get("/api/orders/" + orderNumber).header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(jsonPath("$.status").value("PAID"))
			.andExpect(jsonPath("$.cancellable").value(false));
		mockMvc.perform(post("/api/orders/" + orderNumber + "/cancel").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("CANCEL_VIA_CUSTOMER_SERVICE"));

		// 관리자 취소도 환불 계좌가 있어야 한다
		String admin = admin();
		mockMvc.perform(patch("/api/admin/orders/" + orderNumber + "/status").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CANCELLED\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("REFUND_ACCOUNT_REQUIRED"));
		mockMvc.perform(patch("/api/admin/orders/" + orderNumber + "/status").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"status\":\"CANCELLED\",\"refundAccount\":{\"bank\":\"20\",\"accountNumber\":\"1002123456789\",\"holderName\":\"김토마\"}}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("CANCELLED"));
		assertThat(gateway.cancels).containsExactly(
			new PaymentGateway.RefundAccount("20", "1002123456789", "김토마"));
		assertThat(stockOf10()).isEqualTo(5);
	}

	@Test
	void 입금_전에는_고객이_취소할_수_있고_가상계좌를_닫는다() throws Exception {
		String user = signup("vaflow2");
		String orderNumber = orderWithVirtualAccount(user);

		mockMvc.perform(post("/api/orders/" + orderNumber + "/cancel").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("CANCELLED"));
		assertThat(gateway.cancels).hasSize(1).containsOnlyNulls();
		assertThat(stockOf10()).isEqualTo(5);

		// 취소된 주문에 늦게 온 입금 알림은 상태를 바꾸지 않는다
		depositWebhook(orderNumber, SECRET, "DONE").andExpect(status().isOk());
		assertThat(statusOf(orderNumber)).isEqualTo("CANCELLED");
	}

	@Test
	void 입금_기한이_지나면_자동_취소된다() throws Exception {
		String user = signup("vaflow3");
		String orderNumber = orderWithVirtualAccount(user);
		jdbc.update("update payment set va_due_at = ? where order_id = (select id from orders where order_number = ?)",
			LocalDateTime.now().minusMinutes(1), orderNumber);

		orderService.expireUnpaidOrders();

		assertThat(statusOf(orderNumber)).isEqualTo("CANCELLED");
		assertThat(stockOf10()).isEqualTo(5);
	}
}
