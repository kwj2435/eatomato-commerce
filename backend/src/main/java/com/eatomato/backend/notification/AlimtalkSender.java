package com.eatomato.backend.notification;

import java.util.Map;

/** 알림톡 발송 대행사 호출. 테스트에서는 이 인터페이스만 가짜로 바꾼다. */
public interface AlimtalkSender {

	/**
	 * @param to         수신 번호(숫자만, 예: 01012345678)
	 * @param templateId 검수 완료 템플릿 ID
	 * @param variables  템플릿 변수. 키는 "#{고객명}" 형식
	 * @return 대행사 메시지 ID
	 * @throws AlimtalkException 대행사가 접수하지 않았을 때
	 */
	String send(String to, String templateId, Map<String, String> variables);

	class AlimtalkException extends RuntimeException {

		public AlimtalkException(String message) {
			super(message);
		}
	}
}
