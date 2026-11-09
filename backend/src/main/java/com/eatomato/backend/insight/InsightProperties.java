package com.eatomato.backend.insight;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 마케팅 인사이트 에이전트(Python 워커 insight-agent) 연동 설정.
 *
 * @param agentToken 워커와 주고받는 공유 토큰(X-Internal-Token). 비어 있으면 /internal/insights 를 막는다
 * @param dailyLimit 하루에 요청할 수 있는 실행 수(AI 비용 상한)
 * @param staleAfter RUNNING 으로 이 시간이 지나도록 결과가 없으면 워커가 멈춘 것으로 보고 실패 처리한다
 */
@ConfigurationProperties(prefix = "app.insight")
public record InsightProperties(String agentToken, int dailyLimit, Duration staleAfter) {

	public boolean enabled() {
		return agentToken != null && !agentToken.isBlank();
	}
}
