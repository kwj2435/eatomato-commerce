package com.eatomato.backend.notification;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * 솔라피 알림톡 발송. 형식은 솔라피 공식 SDK(solapi-python)의 send()·Authenticator 와 같다.
 * 알림톡이 실패하면(카카오톡 미사용 등) 솔라피가 발신번호로 문자를 대신 보낸다(disableSms=false).
 * 여기서 성공은 '솔라피가 접수함'이다. 실제 도달 결과는 솔라피 콘솔의 발송 내역에서 본다.
 */
@Component
public class SolapiAlimtalkSender implements AlimtalkSender {

	private static final String SEND_URL = "https://api.solapi.com/messages/v4/send-many/detail";
	private static final int DETAIL_MAX = 250;

	private final AlimtalkProperties properties;
	private final RestClient restClient = RestClient.create();

	public SolapiAlimtalkSender(AlimtalkProperties properties) {
		this.properties = properties;
	}

	@Override
	@SuppressWarnings("unchecked")
	public String send(String to, String templateId, Map<String, String> variables, List<Button> buttons) {
		Map<String, Object> body = requestBody(to, templateId, variables, buttons);
		Map<String, Object> response;
		try {
			response = restClient.post()
				.uri(SEND_URL)
				.header("Authorization", authorization())
				.contentType(MediaType.APPLICATION_JSON)
				.body(body)
				.retrieve()
				.body(Map.class);
		} catch (RestClientResponseException e) {
			// 키 오류·잔액 부족·템플릿 불일치 등. 응답 본문에 errorCode·errorMessage 가 온다.
			throw new AlimtalkException(truncate(e.getStatusCode().value() + " " + e.getResponseBodyAsString()));
		} catch (RestClientException e) {
			throw new AlimtalkException(truncate("솔라피 호출 실패: " + e.getMessage()));
		}
		return messageId(response);
	}

	/** send-many/detail 요청 본문(메시지 한 건). */
	Map<String, Object> requestBody(String to, String templateId, Map<String, String> variables, List<Button> buttons) {
		Map<String, Object> kakaoOptions = new LinkedHashMap<>();
		kakaoOptions.put("pfId", properties.pfId());
		kakaoOptions.put("templateId", templateId);
		kakaoOptions.put("variables", variables);
		kakaoOptions.put("disableSms", false);
		if (!buttons.isEmpty()) {
			// 템플릿에 등록한 버튼을 그대로 보낸다. 솔라피 문서에 생략 시 동작이 적혀 있지 않아 명시한다.
			kakaoOptions.put("buttons", buttons.stream().map(SolapiAlimtalkSender::button).toList());
		}
		Map<String, Object> message = Map.of(
			"to", to,
			"from", properties.sender().replaceAll("[^0-9]", ""),
			"kakaoOptions", kakaoOptions);
		return Map.of("messages", List.of(message), "showMessageList", true);
	}

	private static Map<String, String> button(Button button) {
		Map<String, String> map = new LinkedHashMap<>();
		map.put("buttonName", button.name());
		map.put("buttonType", button.type());
		if (button.link() != null) {
			map.put("linkMo", button.link());
			map.put("linkPc", button.link());
		}
		return map;
	}

	/** 응답에서 접수된 메시지 ID. 실패 목록이 있으면 AlimtalkException. */
	@SuppressWarnings("unchecked")
	private static String messageId(Map<String, Object> response) {
		if (response == null) {
			throw new AlimtalkException("솔라피 응답 없음");
		}
		List<Map<String, Object>> failed = (List<Map<String, Object>>) response.get("failedMessageList");
		if (failed != null && !failed.isEmpty()) {
			Map<String, Object> first = failed.get(0);
			throw new AlimtalkException(truncate(first.get("statusCode") + " " + first.get("statusMessage")));
		}
		List<Map<String, Object>> accepted = (List<Map<String, Object>>) response.get("messageList");
		if (accepted != null && !accepted.isEmpty() && accepted.get(0).get("messageId") != null) {
			return String.valueOf(accepted.get(0).get("messageId"));
		}
		Map<String, Object> group = (Map<String, Object>) response.getOrDefault("groupInfo", Map.of());
		return group.get("groupId") == null ? null : String.valueOf(group.get("groupId"));
	}

	/** HMAC-SHA256 ApiKey=…, Date=…, salt=…, signature=hex(HMAC(secret, date + salt)) */
	String authorization() {
		String date = Instant.now().truncatedTo(ChronoUnit.MILLIS).toString();
		String salt = UUID.randomUUID().toString().replace("-", "");
		return "HMAC-SHA256 ApiKey=%s, Date=%s, salt=%s, signature=%s"
			.formatted(properties.apiKey(), date, salt, sign(properties.apiSecret(), date + salt));
	}

	static String sign(String secret, String data) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
			return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
		} catch (GeneralSecurityException e) {
			throw new IllegalStateException(e);
		}
	}

	private static String truncate(String text) {
		return text.length() <= DETAIL_MAX ? text : text.substring(0, DETAIL_MAX);
	}
}
