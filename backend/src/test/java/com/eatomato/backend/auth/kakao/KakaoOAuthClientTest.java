package com.eatomato.backend.auth.kakao;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.eatomato.backend.global.config.AppProperties;

/** 카카오 응답 해석·인가 주소(스프링 없이). */
class KakaoOAuthClientTest {

	@Test
	void 카카오_전화번호를_010_형식으로() {
		assertThat(KakaoOAuthClient.phone("+82 10-1234-5678")).isEqualTo("010-1234-5678");
		assertThat(KakaoOAuthClient.phone("+82 010-1234-5678")).isEqualTo("010-1234-5678");
		assertThat(KakaoOAuthClient.phone("+82 11-234-5678")).isEqualTo("011-234-5678");
		assertThat(KakaoOAuthClient.phone("+82 2-123-4567")).isNull(); // 유선
		assertThat(KakaoOAuthClient.phone("+1 415-555-0100")).isNull(); // 해외
		assertThat(KakaoOAuthClient.phone(null)).isNull();
	}

	@Test
	void 필수로_켜면_인가_주소에_동의항목을_요청한다() {
		String off = client(false).authorizeUrl("http://localhost:3000/login/kakao/", "st");
		String on = client(true).authorizeUrl("http://localhost:3000/login/kakao/", "st");
		assertThat(off).doesNotContain("scope=");
		assertThat(on).contains("scope=account_email,phone_number,account_ci");
	}

	private static KakaoOAuthClient client(boolean require) {
		AppProperties.Kakao kakao = new AppProperties.Kakao("key", null, List.of(), require);
		return new KakaoOAuthClient(new AppProperties(false, null, null, null, null, null, kakao, null, null, null));
	}
}
