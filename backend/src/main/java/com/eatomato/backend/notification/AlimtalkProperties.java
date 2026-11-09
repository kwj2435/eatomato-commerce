package com.eatomato.backend.notification;

import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 카카오 알림톡(솔라피) 설정. 값이 하나라도 비어 있으면 보내지 않고 발송 기록에 SKIPPED 로만 남긴다.
 *
 * @param apiKey    솔라피 API Key
 * @param apiSecret 솔라피 API Secret
 * @param pfId      솔라피에 연결한 카카오 비즈니스 채널 ID(KA01PF...)
 * @param sender    솔라피에 등록한 발신번호. 알림톡이 실패하면 이 번호로 문자를 대신 보낸다
 * @param templates 종류별 검수 완료 템플릿 ID(KA01TP...). 없는 종류는 보내지 않는다
 */
@ConfigurationProperties(prefix = "app.alimtalk")
public record AlimtalkProperties(String apiKey, String apiSecret, String pfId, String sender,
	Map<AlimtalkTemplate, String> templates) {

	public boolean enabled() {
		return hasText(apiKey) && hasText(apiSecret) && hasText(pfId) && hasText(sender);
	}

	/** 검수 완료된 템플릿 ID. 아직 등록하지 않은 종류면 null. */
	public String templateId(AlimtalkTemplate template) {
		String id = templates == null ? null : templates.get(template);
		return hasText(id) ? id.trim() : null;
	}

	private static boolean hasText(String value) {
		return value != null && !value.isBlank();
	}
}
