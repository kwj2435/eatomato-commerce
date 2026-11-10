package com.eatomato.backend.notification;

import java.util.List;
import java.util.Map;

/** 알림톡 발송 대행사 호출. 테스트에서는 이 인터페이스만 가짜로 바꾼다. */
public interface AlimtalkSender {

	/**
	 * @param to         수신 번호(숫자만, 예: 01012345678)
	 * @param templateId 검수 완료 템플릿 ID
	 * @param variables  템플릿 변수. 키는 "#{고객명}" 형식
	 * @param buttons    템플릿에 등록한 버튼(이름·순서·링크가 검수본과 같아야 한다). 없으면 빈 목록
	 * @return 대행사 메시지 ID
	 * @throws AlimtalkException 대행사가 접수하지 않았을 때
	 */
	String send(String to, String templateId, Map<String, String> variables, List<Button> buttons);

	/**
	 * 템플릿 버튼. type 은 카카오 버튼 종류(WL: 웹링크, DS: 배송조회). 웹링크는 모바일·PC 링크가 같고,
	 * 배송조회는 링크 없이 카카오가 본문의 택배사·송장번호로 조회 화면을 연다.
	 */
	record Button(String name, String type, String link) {

		public static Button webLink(String name, String link) {
			return new Button(name, "WL", link);
		}

		public static Button deliveryTracking(String name) {
			return new Button(name, "DS", null);
		}
	}

	class AlimtalkException extends RuntimeException {

		public AlimtalkException(String message) {
			super(message);
		}
	}
}
