package com.eatomato.backend.analytics;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 스토어 페이지 조회 기록 요청.
 *
 * @param sessionStart 이 방문의 첫 조회인지. 첫 조회에만 referrer 를 보낸다(SPA 이동에서는 document.referrer 가 바뀌지 않는다).
 * @param referrer     document.referrer 원문. 호스트만 남긴다.
 */
public record PageViewRequest(
	@NotBlank @Pattern(regexp = UUID) String visitorId,
	@NotBlank @Pattern(regexp = UUID) String sessionId,
	@NotBlank @Size(max = 500) String path,
	boolean sessionStart,
	@Size(max = 2000) String referrer
) {

	static final String UUID = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
}
