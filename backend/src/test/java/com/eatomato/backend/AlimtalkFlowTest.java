package com.eatomato.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.after;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import java.util.function.Predicate;

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

import com.eatomato.backend.auth.naver.NaverOAuthClient;
import com.eatomato.backend.auth.naver.NaverUser;
import com.eatomato.backend.notification.AlimtalkSender;
import com.eatomato.backend.notification.AlimtalkService;
import com.eatomato.backend.notification.AlimtalkTemplate;
import com.jayway.jsonpath.JsonPath;

/**
 * 카카오 알림톡: 주문 단계마다 받는 분 연락처로 한 번씩 보낸다(가입 알림은 없다). 대행사 호출(AlimtalkSender)만 가짜로 바꾼다.
 * 발송은 커밋 뒤 비동기라 Mockito timeout 으로 기다린다.
 */
@SpringBootTest(properties = {
	"app.alimtalk.api-key=test-key", "app.alimtalk.api-secret=test-secret", "app.alimtalk.pf-id=KA01PF-test",
	"app.alimtalk.sender=02-1234-5678",
	"app.alimtalk.templates.ORDER_PAID=tpl-paid",
	"app.alimtalk.templates.ORDER_PREPARING=tpl-preparing", "app.alimtalk.templates.ORDER_SHIPPING=tpl-shipping",
	"app.alimtalk.templates.ORDER_CANCELLED=tpl-cancelled",
	"app.naver.client-id=test-id", "app.naver.client-secret=test-secret"})
@AutoConfigureMockMvc
@ActiveProfiles("local")
class AlimtalkFlowTest {

	private static final int WAIT_MS = 5000;

	@Autowired
	MockMvc mockMvc;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	AlimtalkService alimtalkService;

	@MockitoBean
	AlimtalkSender sender;

	@MockitoBean
	NaverOAuthClient naverOAuthClient;

	private String login(String loginId, String password) throws Exception {
		String body = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"%s\",\"password\":\"%s\"}".formatted(loginId, password)))
			.andReturn().getResponse().getContentAsString();
		return "Bearer " + JsonPath.read(body, "$.accessToken");
	}

	private String signup(String loginId) throws Exception {
		String body = mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"%s\",\"password\":\"password123\",\"email\":\"%s@example.com\",\"name\":\"회원\"}"
					.formatted(loginId, loginId)))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		return "Bearer " + JsonPath.read(body, "$.accessToken");
	}

	/** 주문서 제출(결제 전). 주문번호를 돌려준다. */
	private String order(String user, String recipientPhone) throws Exception {
		mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"productId\":12,\"options\":{\"color\":\"cream\",\"type\":\"basic\"},\"quantity\":1}"))
			.andExpect(status().isOk());
		String order = mockMvc.perform(post("/api/orders").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"shipping\":{\"recipientName\":\"받는사람\",\"recipientPhone\":\"%s\",\"zipCode\":\"21986\",\"roadAddress\":\"테스트로 1\"}}"
					.formatted(recipientPhone)))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		return JsonPath.read(order, "$.orderNumber");
	}

	private void pay(String user, String orderNumber) throws Exception {
		Integer total = jdbc.queryForObject("select total_amount from orders where order_number = ?", Integer.class, orderNumber);
		mockMvc.perform(post("/api/payments/confirm").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"orderNumber\":\"%s\",\"paymentKey\":\"mock-%s\",\"amount\":%d}".formatted(orderNumber, orderNumber, total)))
			.andExpect(status().isOk());
	}

	private Long orderId(String orderNumber) {
		return jdbc.queryForObject("select id from orders where order_number = ?", Long.class, orderNumber);
	}

	private static Map<String, String> vars(Predicate<Map<String, String>> check) {
		return argThat(check::test);
	}

	@Test
	void 결제부터_배송까지_단계마다_받는_분_번호로_한_번씩() throws Exception {
		given(sender.send(anyString(), anyString(), any())).willReturn("msg-1");
		String admin = login("admin", "admin1234");
		String user = signup("alim1");
		String orderNumber = order(user, "010-2222-3333");

		pay(user, orderNumber);
		verify(sender, timeout(WAIT_MS)).send(eq("01022223333"), eq("tpl-paid"), vars(v ->
			orderNumber.equals(v.get("#{주문번호}")) && "받는사람".equals(v.get("#{고객명}"))
				&& v.get("#{상품명}") != null && v.get("#{결제금액}").matches("[0-9,]+")));

		mockMvc.perform(patch("/api/admin/orders/" + orderNumber + "/status").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"PREPARING\"}"))
			.andExpect(status().isOk());
		verify(sender, timeout(WAIT_MS)).send(eq("01022223333"), eq("tpl-preparing"),
			vars(v -> orderNumber.equals(v.get("#{주문번호}"))));

		mockMvc.perform(put("/api/admin/orders/" + orderNumber + "/tracking").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"courier\":\"CJ대한통운\",\"trackingNumber\":\"1234 5678 9012\"}"))
			.andExpect(status().isOk());
		mockMvc.perform(patch("/api/admin/orders/" + orderNumber + "/status").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"SHIPPING\"}"))
			.andExpect(status().isOk());
		verify(sender, timeout(WAIT_MS)).send(eq("01022223333"), eq("tpl-shipping"), vars(v ->
			"CJ대한통운".equals(v.get("#{택배사}")) && "123456789012".equals(v.get("#{송장번호}"))));

		// 같은 알림을 다시 요청해도 보내지 않는다
		alimtalkService.sendForOrder(orderId(orderNumber), AlimtalkTemplate.ORDER_PAID);
		verify(sender, times(1)).send(anyString(), eq("tpl-paid"), vars(v -> orderNumber.equals(v.get("#{주문번호}"))));

		// 발송 기록: 번호는 가려서 남긴다
		assertThat(jdbc.queryForList(
			"select template, status, phone, message_id from notification_log where order_id = ? order by id", orderId(orderNumber)))
			.extracting(row -> row.get("template") + "/" + row.get("status") + "/" + row.get("phone") + "/" + row.get("message_id"))
			.containsExactly("ORDER_PAID/SENT/010-****-3333/msg-1", "ORDER_PREPARING/SENT/010-****-3333/msg-1",
				"ORDER_SHIPPING/SENT/010-****-3333/msg-1");
	}

	@Test
	void 결제_전_취소는_보내지_않고_결제_후_취소는_환불_안내() throws Exception {
		given(sender.send(anyString(), anyString(), any())).willReturn("msg-2");
		String user = signup("alim2");

		String unpaid = order(user, "01044445555");
		mockMvc.perform(post("/api/orders/" + unpaid + "/cancel").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isOk());

		String paid = order(user, "01044445555");
		pay(user, paid);
		mockMvc.perform(post("/api/orders/" + paid + "/cancel").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isOk());
		verify(sender, timeout(WAIT_MS)).send(eq("01044445555"), eq("tpl-cancelled"), vars(v ->
			paid.equals(v.get("#{주문번호}")) && v.get("#{환불금액}").matches("[0-9,]+")));

		verify(sender, never()).send(anyString(), anyString(), vars(v -> unpaid.equals(v.get("#{주문번호}"))));
	}

	@Test
	void 발송에_실패해도_주문은_결제완료로_남고_실패가_기록된다() throws Exception {
		given(sender.send(anyString(), anyString(), any()))
			.willThrow(new AlimtalkSender.AlimtalkException("3104 템플릿 불일치"));
		String user = signup("alim3");
		String orderNumber = order(user, "01066667777");

		pay(user, orderNumber);
		verify(sender, timeout(WAIT_MS)).send(eq("01066667777"), eq("tpl-paid"), any());

		Long orderId = orderId(orderNumber);
		assertThat(jdbc.queryForObject("select status from orders where id = ?", String.class, orderId)).isEqualTo("PAID");
		// 실패 기록은 발송 호출 직후에 저장된다
		Thread.sleep(300);
		assertThat(jdbc.queryForMap("select status, detail from notification_log where order_id = ?", orderId))
			.containsEntry("status", "FAILED").containsEntry("detail", "3104 템플릿 불일치");
	}

	@Test
	void 가입에는_알림톡을_보내지_않는다() throws Exception {
		// 네이버 가입은 휴대폰 번호까지 받지만, 가입 알림은 보내지 않는다
		given(naverOAuthClient.fetchUser("code-alim", "st"))
			.willReturn(new NaverUser("naver-alim", "naver.alim@example.com", "김알림", "010-8888-9999"));
		mockMvc.perform(post("/api/auth/naver").contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"code-alim\",\"state\":\"st\",\"redirectUri\":\"http://localhost:3000/login/naver/\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.member.phone.last").value("9999"));
		verify(sender, after(500).never()).send(eq("01088889999"), anyString(), any());
	}
}
