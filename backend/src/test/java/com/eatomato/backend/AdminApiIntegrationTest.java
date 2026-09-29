package com.eatomato.backend;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

/**
 * 관리자 API. local 프로필의 관리자 계정(admin / admin1234)을 쓴다.
 * ApiIntegrationTest 와 DB 를 공유하므로, 거기서 개수를 세는 카테고리(phone-case 등)에는 상품을 만들지 않는다.
 */
@SpringBootTest(properties = "app.upload.dir=build/test-uploads")
@AutoConfigureMockMvc
@ActiveProfiles("local")
class AdminApiIntegrationTest {

	@Autowired
	MockMvc mockMvc;

	private String login(String loginId, String password) throws Exception {
		String body = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"%s\",\"password\":\"%s\"}".formatted(loginId, password)))
			.andExpect(status().isOk())
			.andReturn().getResponse().getContentAsString();
		return "Bearer " + JsonPath.read(body, "$.accessToken");
	}

	private String signup(String loginId) throws Exception {
		String body = mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"loginId":"%s","password":"password123","email":"%s@example.com","name":"회원"}
					""".formatted(loginId, loginId)))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		return "Bearer " + JsonPath.read(body, "$.accessToken");
	}

	@Test
	void 일반회원은_관리자_API_403() throws Exception {
		String user = signup("plainuser");
		mockMvc.perform(get("/api/admin/dashboard").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/admin/dashboard")).andExpect(status().isUnauthorized());
	}

	@Test
	void 권한을_주거나_빼면_기존_토큰에도_바로_반영된다() throws Exception {
		String user = signup("promoteme");
		mockMvc.perform(get("/api/admin/dashboard").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isForbidden());

		String admin = login("admin", "admin1234");
		String list = mockMvc.perform(get("/api/admin/members").param("q", "promoteme")
				.header(HttpHeaders.AUTHORIZATION, admin))
			.andReturn().getResponse().getContentAsString();
		String memberId = JsonPath.read(list, "$.content[0].id");

		mockMvc.perform(patch("/api/admin/members/" + memberId).header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"ADMIN\"}"))
			.andExpect(status().isOk());
		// 권한을 받기 전에 발급된 토큰(roles=USER) 그대로
		mockMvc.perform(get("/api/admin/dashboard").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isOk());

		mockMvc.perform(patch("/api/admin/members/" + memberId).header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"USER\"}"))
			.andExpect(status().isOk());
		mockMvc.perform(get("/api/admin/dashboard").header(HttpHeaders.AUTHORIZATION, user))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.code").value("FORBIDDEN"));
	}

	@Test
	void 관리자_로그인과_대시보드() throws Exception {
		String admin = login("admin", "admin1234");
		mockMvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(jsonPath("$.role").value("ADMIN"));
		mockMvc.perform(get("/api/admin/dashboard").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.dailySales", hasSize(14)))
			.andExpect(jsonPath("$.onSaleProducts").value(greaterThanOrEqualTo(16)))
			.andExpect(jsonPath("$.ordersByStatus.PAID").exists());
	}

	@Test
	void 상품_등록_수정_숨김_삭제() throws Exception {
		String admin = login("admin", "admin1234");
		String request = """
			{"slug":"admin-test-case","name":"관리자 테스트 케이스","optionSummary":"옵션 | 맥세이프",
			 "price":30000,"salePrice":25000,"categoryCode":"set",
			 "rewardRate":3,"noticeText":"첫 줄\\n둘째 줄","visible":true,"badges":["NEW"],
			 "detailImages":["https://example.com/a.jpg"],
			 "optionGroups":[{"code":"color","label":"색상","choices":[
			   {"code":"cream","label":"크림","priceDelta":0},{"code":"red","label":"레드","priceDelta":1000}]}],
			 "relatedProductIds":[1,2]}
			""";
		String created = mockMvc.perform(post("/api/admin/products").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content(request))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.optionGroups[0].choices", hasSize(2)))
			.andExpect(jsonPath("$.relatedProductIds", hasSize(2)))
			.andReturn().getResponse().getContentAsString();
		String id = JsonPath.read(created, "$.id");

		// 스토어프론트에 바로 보인다
		mockMvc.perform(get("/api/products/admin-test-case"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.noticeLines", hasSize(2)))
			.andExpect(jsonPath("$.betterTogether", hasSize(2)));

		// 같은 slug 로는 또 못 만든다
		mockMvc.perform(post("/api/admin/products").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content(request))
			.andExpect(status().isConflict());

		// 수정: 같은 옵션 그룹 코드를 유지한 채 선택지를 바꾼다 (유니크 제약 확인)
		mockMvc.perform(put("/api/admin/products/" + id).header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON)
				.content(request.replace("\"priceDelta\":1000", "\"priceDelta\":2000").replace("30000", "32000")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.price").value(32000))
			.andExpect(jsonPath("$.optionGroups[0].choices[1].priceDelta").value(2000));

		// 숨기면 스토어프론트에서 사라지고 관리자 목록에는 남는다
		mockMvc.perform(patch("/api/admin/products/" + id + "/visible").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"visible\":false}"))
			.andExpect(status().isNoContent());
		mockMvc.perform(get("/api/products/admin-test-case")).andExpect(status().isNotFound());
		mockMvc.perform(get("/api/admin/products").param("q", "admin-test").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(jsonPath("$.content", hasSize(1)))
			.andExpect(jsonPath("$.content[0].visible").value(false));

		// 삭제하면 관리자 목록에서도 빠지고 slug 를 다시 쓸 수 있다
		mockMvc.perform(delete("/api/admin/products/" + id).header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(status().isNoContent());
		mockMvc.perform(get("/api/admin/products").param("q", "admin-test").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(jsonPath("$.content", hasSize(0)));
		mockMvc.perform(post("/api/admin/products").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content(request))
			.andExpect(status().isCreated());
	}

	private String createProduct(String admin, String slug, int price) throws Exception {
		String created = mockMvc.perform(post("/api/admin/products").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"slug":"%s","name":"할인 테스트","price":%d,"categoryCode":"set","rewardRate":0,"visible":true}
					""".formatted(slug, price)))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		return JsonPath.read(created, "$.id");
	}

	@Test
	void 할인율_일괄_조정() throws Exception {
		String admin = login("admin", "admin1234");
		String a = createProduct(admin, "discount-a", 30000);
		String b = createProduct(admin, "discount-b", 12345);
		String body = "{\"productIds\":[%s,%s],\"rate\":%d,\"roundingUnit\":%d}";

		// 15% 할인, 100원 단위 절사: 30000 → 25500, 12345 → 10493.25 → 10400
		mockMvc.perform(patch("/api/admin/products/discount").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content(body.formatted(a, b, 15, 100)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(2)))
			.andExpect(jsonPath("$[?(@.id=='%s')].salePrice".formatted(a)).value(25500))
			.andExpect(jsonPath("$[?(@.id=='%s')].salePrice".formatted(b)).value(10400));
		mockMvc.perform(get("/api/products/discount-b"))
			.andExpect(jsonPath("$.salePrice").value(10400));

		// 0% 는 할인 해제
		mockMvc.perform(patch("/api/admin/products/discount").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content(body.formatted(a, b, 0, 1)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].salePrice").doesNotExist())
			.andExpect(jsonPath("$[1].salePrice").doesNotExist());

		// 허용하지 않는 절사 단위·할인율, 없는 상품
		mockMvc.perform(patch("/api/admin/products/discount").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content(body.formatted(a, b, 10, 50)))
			.andExpect(status().isBadRequest());
		mockMvc.perform(patch("/api/admin/products/discount").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content(body.formatted(a, b, 96, 1)))
			.andExpect(status().isBadRequest());
		mockMvc.perform(patch("/api/admin/products/discount").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content(body.formatted(a, "999999", 10, 1)))
			.andExpect(status().isNotFound());
	}

	@Test
	void 회원_관리와_이용정지() throws Exception {
		String admin = login("admin", "admin1234");
		signup("suspendme");

		String list = mockMvc.perform(get("/api/admin/members").param("q", "suspendme")
				.header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(jsonPath("$.content", hasSize(1)))
			.andReturn().getResponse().getContentAsString();
		String memberId = JsonPath.read(list, "$.content[0].id");

		mockMvc.perform(patch("/api/admin/members/" + memberId).header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":false,\"grade\":\"VIP\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.summary.enabled").value(false))
			.andExpect(jsonPath("$.summary.grade").value("VIP"));

		mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"loginId\":\"suspendme\",\"password\":\"password123\"}"))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.code").value("MEMBER_DISABLED"));

		// 본인 권한은 못 바꾼다
		String adminList = mockMvc.perform(get("/api/admin/members").param("q", "admin").param("role", "ADMIN")
				.header(HttpHeaders.AUTHORIZATION, admin))
			.andReturn().getResponse().getContentAsString();
		String adminId = JsonPath.read(adminList, "$.content[0].id");
		mockMvc.perform(patch("/api/admin/members/" + adminId).header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"USER\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("CANNOT_CHANGE_SELF"));
	}

	@Test
	void 주문_현황과_상태_변경() throws Exception {
		String admin = login("admin", "admin1234");
		String user = signup("orderuser");
		mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"productId\":7,\"options\":{\"color\":\"cream\",\"type\":\"basic\"},\"quantity\":1}"))
			.andExpect(status().isOk());
		String order = mockMvc.perform(post("/api/orders").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON).content("{\"shipping\":{\"recipientName\":\"김토마\",\"recipientPhone\":\"010-1234-5678\",\"zipCode\":\"21986\",\"roadAddress\":\"인천 연수구 송도문화로 28\"}}"))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		String orderNumber = JsonPath.read(order, "$.orderNumber");
		int total = JsonPath.read(order, "$.total");
		mockMvc.perform(post("/api/payments/confirm").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"orderNumber\":\"%s\",\"paymentKey\":\"mock-admin\",\"amount\":%d}".formatted(orderNumber, total)))
			.andExpect(status().isOk());

		mockMvc.perform(get("/api/admin/orders").param("q", "orderuser").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(jsonPath("$.content", hasSize(1)))
			.andExpect(jsonPath("$.content[0].member.loginId").value("orderuser"));

		mockMvc.perform(patch("/api/admin/orders/" + orderNumber + "/status").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"SHIPPING\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("SHIPPING"));

		mockMvc.perform(get("/api/admin/orders").param("status", "SHIPPING").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))));

		mockMvc.perform(get("/api/admin/dashboard").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(jsonPath("$.today.orders").value(greaterThanOrEqualTo(1)))
			.andExpect(jsonPath("$.topProducts", hasSize(greaterThanOrEqualTo(1))));
	}

	@Test
	void 사이트_문구_수정과_기본값_되돌리기() throws Exception {
		mockMvc.perform(get("/api/site-contents"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.HOME_WHATS_NEW_DESCRIPTION").value(startsWith("일상에 신선한 감각을")));

		String admin = login("admin", "admin1234");
		mockMvc.perform(get("/api/admin/site-contents").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(jsonPath("$", hasSize(2)))
			.andExpect(jsonPath("$[0].customized").value(false));

		mockMvc.perform(put("/api/admin/site-contents/HOME_REVIEW_DESCRIPTION").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"value\":\"  첫 줄\\r\\n둘째 줄  \"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.customized").value(true))
			.andExpect(jsonPath("$.value").value("첫 줄\n둘째 줄"));
		mockMvc.perform(get("/api/site-contents"))
			.andExpect(jsonPath("$.HOME_REVIEW_DESCRIPTION").value("첫 줄\n둘째 줄"));

		mockMvc.perform(delete("/api/admin/site-contents/HOME_REVIEW_DESCRIPTION").header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(jsonPath("$.customized").value(false));
		mockMvc.perform(get("/api/site-contents"))
			.andExpect(jsonPath("$.HOME_REVIEW_DESCRIPTION").value(startsWith("신제품설명이")));

		mockMvc.perform(put("/api/admin/site-contents/UNKNOWN").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON).content("{\"value\":\"x\"}"))
			.andExpect(status().isNotFound());
		String user = signup("contentuser");
		mockMvc.perform(put("/api/admin/site-contents/HOME_REVIEW_DESCRIPTION").header(HttpHeaders.AUTHORIZATION, user)
				.contentType(MediaType.APPLICATION_JSON).content("{\"value\":\"x\"}"))
			.andExpect(status().isForbidden());
	}

	@Test
	void 배너_공지_업로드() throws Exception {
		String admin = login("admin", "admin1234");

		String banner = mockMvc.perform(post("/api/admin/banners").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"href":"/products/set","imageUrl":"https://example.com/fall.jpg","alt":"가을 신상 지금 만나보세요",
					 "sortOrder":0,"active":false}
					"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.active").value(false))
			.andReturn().getResponse().getContentAsString();
		String bannerId = JsonPath.read(banner, "$.id");

		// 비활성 배너는 메인에 안 나온다
		mockMvc.perform(get("/api/banners")).andExpect(jsonPath("$", hasSize(7)));
		mockMvc.perform(put("/api/admin/banners/" + bannerId).header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"href":"/products/set","imageUrl":"https://example.com/fall.jpg","alt":"가을 신상","sortOrder":0,"active":true}
					"""))
			.andExpect(status().isOk());
		mockMvc.perform(get("/api/banners"))
			.andExpect(jsonPath("$", hasSize(8)))
			.andExpect(jsonPath("$[0].alt").value("가을 신상"))
			.andExpect(jsonPath("$[0].captionLines").doesNotExist());

		// 이미지 없는 배너는 받지 않는다(문구를 이미지에 넣으므로)
		mockMvc.perform(post("/api/admin/banners").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"href\":\"/\",\"alt\":\"이미지 없음\",\"sortOrder\":1,\"active\":true}"))
			.andExpect(status().isBadRequest());
		mockMvc.perform(delete("/api/admin/banners/" + bannerId).header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(status().isNoContent());

		String notice = mockMvc.perform(post("/api/admin/notices").header(HttpHeaders.AUTHORIZATION, admin)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"number\":20,\"title\":\"새 공지\",\"pinned\":false,\"body\":[\"첫 문단\\n둘째 문단\"]}"))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.author").value("관리자"))
			.andExpect(jsonPath("$.body", hasSize(2)))
			.andReturn().getResponse().getContentAsString();
		String noticeId = JsonPath.read(notice, "$.id");
		mockMvc.perform(delete("/api/admin/notices/" + noticeId).header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(status().isNoContent());

		MockMultipartFile file = new MockMultipartFile("file", "p.png", "image/png", new byte[] {1, 2, 3});
		mockMvc.perform(multipart("/api/admin/uploads").file(file).param("category", "banners")
				.header(HttpHeaders.AUTHORIZATION, admin))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.url").value(startsWith("http://localhost:8080/uploads/banners/")));
	}
}
