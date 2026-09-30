package com.eatomato.backend;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

/**
 * local 프로필(H2 + 데모 데이터)로 주요 API 흐름을 끝까지 확인한다.
 * 테스트들이 같은 DB 를 공유하므로, 데이터를 바꾸는 흐름 테스트(mellow-macsafe)와 조회 테스트는 서로 다른 상품을 본다.
 */
@SpringBootTest(properties = "app.upload.dir=build/test-uploads")
@AutoConfigureMockMvc
@ActiveProfiles("local")
class ApiIntegrationTest {

	@Autowired
	MockMvc mockMvc;

	@Test
	void 카탈로그_조회() throws Exception {
		mockMvc.perform(get("/api/categories"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(5)))
			.andExpect(jsonPath("$[0].slug").value("phone-case"))
			.andExpect(jsonPath("$[0].subcategories[0].slug").value(nullValue()))
			.andExpect(jsonPath("$[0].subcategories[0].label").value("All"))
			.andExpect(jsonPath("$[1].slug").value("earphone-case"))
			.andExpect(jsonPath("$[2].label").value("Accessories"))
			.andExpect(jsonPath("$[3].subcategories", hasSize(1)))
			.andExpect(jsonPath("$[4].slug").value("objects"));

		// 할인가 기준 낮은가격순: JELLY AIRY TINT(17,500) 가 가장 싸다
		mockMvc.perform(get("/api/products").param("category", "phone-case").param("sort", "price-asc"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(6)))
			.andExpect(jsonPath("$[0].slug").value("jelly-airy-tint"));

		mockMvc.perform(get("/api/products").param("category", "phone-acc").param("subcategory", "tok"))
			.andExpect(jsonPath("$", hasSize(2)))
			.andExpect(jsonPath("$[0].slug").value("tok-cream-round"));

		mockMvc.perform(get("/api/products").param("category", "phone-case").param("subcategory", "tok"))
			.andExpect(status().isNotFound());

		mockMvc.perform(get("/api/products/new").param("limit", "4"))
			.andExpect(jsonPath("$", hasSize(4)));

		mockMvc.perform(get("/api/products/search").param("q", "mellow"))
			.andExpect(jsonPath("$", hasSize(5)));

		mockMvc.perform(get("/api/products/dottie-cream-red"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.salePrice").value(19000))
			.andExpect(jsonPath("$.badges[0]").value("SALE"))
			.andExpect(jsonPath("$.optionGroups", hasSize(3)))
			.andExpect(jsonPath("$.optionGroups[1].choices[1].priceDelta").value(4000))
			.andExpect(jsonPath("$.betterTogether", hasSize(2)))
			.andExpect(jsonPath("$.noticeLines", hasSize(5)))
			.andExpect(jsonPath("$.reviews", hasSize(4)))
			.andExpect(jsonPath("$.reviews[0].isBest").value(true))
			.andExpect(jsonPath("$.reviewCount").value(4));

		mockMvc.perform(get("/api/products/clear-jelly-basic"))
			.andExpect(jsonPath("$.salePrice").doesNotExist());

		mockMvc.perform(get("/api/products/unknown"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("PRODUCT_NOT_FOUND"));

		mockMvc.perform(get("/api/products/dottie-cream-red/reviews").param("size", "2"))
			.andExpect(jsonPath("$.content", hasSize(2)))
			.andExpect(jsonPath("$.page.totalElements").value(4));
	}

	@Test
	void 배너_공지_대표리뷰_조회() throws Exception {
		mockMvc.perform(get("/api/banners"))
			.andExpect(jsonPath("$", hasSize(7)))
			.andExpect(jsonPath("$[0].imageUrl").exists())
			.andExpect(jsonPath("$[0].captionLines").doesNotExist());

		mockMvc.perform(get("/api/notices"))
			.andExpect(jsonPath("$", hasSize(19)))
			.andExpect(jsonPath("$[0].pinned").value(true))
			.andExpect(jsonPath("$[0].number").value(nullValue()))
			.andExpect(jsonPath("$[0].publishedAt").value("2026-07-09T19:21:00+09:00"))
			.andExpect(jsonPath("$[12].number").value(13));

		mockMvc.perform(get("/api/notices").param("query", "배송"))
			.andExpect(jsonPath("$", hasSize(3)));

		mockMvc.perform(get("/api/reviews/featured"))
			.andExpect(jsonPath("$", hasSize(4)));
	}

	@Test
	void 이메일만으로_가입하면_아이디가_생성되고_이메일로_로그인() throws Exception {
		mockMvc.perform(post("/api/auth/signup")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"password":"password123","email":"Tomato.Kim@example.com","name":"김토마"}
					"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.member.id").value(org.hamcrest.Matchers.matchesPattern("tomatokim\\d{4}")));

		mockMvc.perform(post("/api/auth/signup")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"password":"password123","email":"Tomato.Kim@example.com","name":"중복"}
					"""))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("DUPLICATE_EMAIL"));

		mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"loginId":"Tomato.Kim@example.com","password":"password123"}
					"""))
			.andExpect(status().isOk());
	}

	@Test
	void 인증_필요한_API는_토큰없이_401() throws Exception {
		mockMvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
		mockMvc.perform(get("/api/cart")).andExpect(status().isUnauthorized());
	}

	@Test
	void 가입_장바구니_주문_후기_흐름() throws Exception {
		String signup = mockMvc.perform(post("/api/auth/signup")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"loginId":"tomato01","password":"password123","email":"tomato01@example.com","name":"김토마"}
					"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.tokenType").value("Bearer"))
			.andExpect(jsonPath("$.member.id").value("tomato01"))
			.andReturn().getResponse().getContentAsString();

		mockMvc.perform(post("/api/auth/signup")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"loginId":"tomato01","password":"password123","email":"other@example.com","name":"김토마"}
					"""))
			.andExpect(status().isConflict());

		mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"loginId":"tomato01@example.com","password":"wrong-password"}
					"""))
			.andExpect(status().isUnauthorized());

		String token = "Bearer " + JsonPath.read(signup, "$.accessToken");

		mockMvc.perform(patch("/api/me").header(HttpHeaders.AUTHORIZATION, token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"phone":{"first":"010","middle":"1234","last":"5678"},
					 "birthDate":{"year":1995,"month":10,"day":27},
					 "gender":"female","marketingChannels":["email"]}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.phone.middle").value("1234"))
			.andExpect(jsonPath("$.birthDate.month").value(10))
			.andExpect(jsonPath("$.gender").value("female"))
			.andExpect(jsonPath("$.marketingChannels", hasSize(1)));

		String detail = mockMvc.perform(get("/api/products/mellow-macsafe"))
			.andReturn().getResponse().getContentAsString();
		String productId = JsonPath.read(detail, "$.id");

		String addBody = """
			{"productId":%s,"options":{"color":"cream","mount":"macsafe","model":"iphone-17-pro"},"quantity":2}
			""".formatted(productId);

		// 판매가 19,000 + 맥세이프 4,000 = 23,000 × 2 = 46,000 → 배송비 3,000
		mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, token)
				.contentType(MediaType.APPLICATION_JSON).content(addBody))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.items", hasSize(1)))
			.andExpect(jsonPath("$.items[0].unitPrice").value(23000))
			.andExpect(jsonPath("$.items[0].option").value(startsWith("색상: 크림")))
			.andExpect(jsonPath("$.summary.subtotal").value(46000))
			.andExpect(jsonPath("$.summary.shippingFee").value(3000));

		// 같은 옵션은 한 줄로 합쳐진다: 23,000 × 4 = 92,000 → 무료배송
		mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, token)
				.contentType(MediaType.APPLICATION_JSON).content(addBody))
			.andExpect(jsonPath("$.items", hasSize(1)))
			.andExpect(jsonPath("$.items[0].quantity").value(4))
			.andExpect(jsonPath("$.summary.shippingFee").value(0))
			.andExpect(jsonPath("$.summary.total").value(92000));

		mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"productId":%s,"options":{"color":"cream"},"quantity":1}
					""".formatted(productId)))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("INVALID_OPTION"));

		String order = mockMvc.perform(post("/api/orders").header(HttpHeaders.AUTHORIZATION, token)
				.contentType(MediaType.APPLICATION_JSON).content("{\"shipping\":{\"recipientName\":\"김토마\",\"recipientPhone\":\"010-1234-5678\",\"zipCode\":\"21986\",\"roadAddress\":\"인천 연수구 송도문화로 28\"}}"))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.status").value("PENDING_PAYMENT"))
			.andExpect(jsonPath("$.total").value(92000))
			.andExpect(jsonPath("$.items", hasSize(1)))
			.andReturn().getResponse().getContentAsString();
		String orderNumber = JsonPath.read(order, "$.orderNumber");
		mockMvc.perform(post("/api/payments/confirm").header(HttpHeaders.AUTHORIZATION, token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"orderNumber\":\"%s\",\"paymentKey\":\"mock-1\",\"amount\":92000}".formatted(orderNumber)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("PAID"));

		mockMvc.perform(get("/api/cart").header(HttpHeaders.AUTHORIZATION, token))
			.andExpect(jsonPath("$.items", hasSize(0)));

		String reviewable = mockMvc.perform(get("/api/me/reviewable-products").header(HttpHeaders.AUTHORIZATION, token))
			.andExpect(jsonPath("$", hasSize(1)))
			.andExpect(jsonPath("$[0].slug").value("mellow-macsafe"))
			.andReturn().getResponse().getContentAsString();
		String orderItemId = JsonPath.read(reviewable, "$[0].orderItemId");

		MockMultipartFile photo = new MockMultipartFile("photos", "case.jpg", "image/jpeg", new byte[] {1, 2, 3});
		mockMvc.perform(multipart("/api/reviews").file(photo)
				.header(HttpHeaders.AUTHORIZATION, token)
				.param("orderItemId", orderItemId)
				.param("rating", "5")
				.param("content", "실물이 더 예뻐요"))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.images[0]").value(startsWith("http://localhost:8080/uploads/reviews/")));

		mockMvc.perform(multipart("/api/reviews")
				.header(HttpHeaders.AUTHORIZATION, token)
				.param("orderItemId", orderItemId)
				.param("rating", "5")
				.param("content", "두 번째 후기"))
			.andExpect(status().isConflict());

		mockMvc.perform(get("/api/me/reviewable-products").header(HttpHeaders.AUTHORIZATION, token))
			.andExpect(jsonPath("$", hasSize(0)));

		mockMvc.perform(get("/api/products/mellow-macsafe"))
			.andExpect(jsonPath("$.reviewCount").value(5));

		mockMvc.perform(get("/api/orders").header(HttpHeaders.AUTHORIZATION, token))
			.andExpect(jsonPath("$", hasSize(1)))
			.andExpect(jsonPath("$[0].items[0].reviewed").value(true));
	}
}
