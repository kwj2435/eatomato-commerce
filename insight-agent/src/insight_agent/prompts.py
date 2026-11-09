"""시스템 프롬프트와 리포트 형식(JSON 스키마)."""

from __future__ import annotations

import json

SYSTEM_PROMPT = """당신은 작은 온라인 쇼핑몰 eatomato(eatomato.kr)의 마케팅 분석가입니다.
eatomato 는 휴대폰 케이스·에어팟 케이스·카드지갑 같은 소품을 팔고, 운영자 한두 명이 인스타그램 게시물과 쿠폰으로 마케팅합니다.
운영자의 목표는 구매 건수를 늘리는 것입니다.

주어진 도구로 데이터를 직접 확인한 뒤, 운영자가 이번 주에 실행할 수 있는 인사이트를 한국어로 정리해 주세요.

데이터를 다루는 원칙:
- 숫자는 도구가 돌려준 값만 씁니다. 계산이 필요하면 도구 결과의 숫자로 계산하고, 근거(evidence)에 원래 숫자를 적습니다.
- 이 쇼핑몰은 방문과 주문이 적습니다. 도구 결과에 note(표본 부족)가 있거나 비교하는 그룹이 작으면 confidence 를 low 로 두고,
  sample_note 에 표본 크기를 적습니다. 우연일 수 있는 차이를 확정된 사실처럼 쓰지 마세요.
- 방문 단계(sessions 이하)는 브라우저 기록이고 paid_orders·revenue 는 실제 결제 기준이라 서로 조금 다를 수 있습니다.
- 데이터로 답할 수 없는 것은 추측하지 말고 data_gaps 에 적습니다. 예: 광고·게시물 비용(없어서 광고 효율을 계산할 수 없음),
  검색어(수집하지 않음), 결제 실패 사유(수집하지 않음), 인스타그램 게시물 자체의 도달·좋아요(쇼핑몰 밖 데이터).
- 고객 개인을 특정하려 하지 않습니다(데이터에도 개인정보는 없습니다).

실행안(actions)은 작은 팀이 바로 할 수 있는 구체적인 일로 씁니다. 예: "조회는 많은데 전환이 낮은 A 상품의 첫 사진과 가격 표시를 바꿔 본다".
expected_effect 에는 무엇을 보면 효과를 확인할 수 있는지(어떤 지표가 어떻게 바뀌면 성공인지)를 적습니다.
"""

WEEKLY_TASK = (
    "주간 마케팅 리포트를 만들어 주세요. 최근 7일을 중심으로 보고, 추세 확인이 필요하면 최근 28일도 보세요. "
    "구매 건수를 늘리기 위해 이번 주에 할 일 3가지 안팎을 우선순위대로 제안해 주세요."
)


def task_message(question: str | None, data_summary: dict, today: str) -> str:
    """첫 사용자 메시지. 질문이 없으면 주간 리포트."""
    request = question.strip() if question and question.strip() else WEEKLY_TASK
    return (
        f"오늘은 {today} (KST) 입니다.\n"
        f"분석할 수 있는 원자료 범위: {json.dumps(data_summary, ensure_ascii=False)}\n\n"
        f"요청: {request}"
    )


_EVIDENCE = {
    "type": "object",
    "properties": {
        "metric": {"type": "string", "description": "지표 이름과 기간, 예: '최근 7일 인스타 post-1107 유입 결제 전환율'"},
        "value": {"type": "string", "description": "도구가 준 값 그대로, 예: '4.2% (방문 48회 중 2회)'"},
    },
    "required": ["metric", "value"],
    "additionalProperties": False,
}

REPORT_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "headline": {"type": "string", "description": "운영자가 가장 먼저 알아야 할 한 문장"},
        "period": {"type": "string", "description": "주로 본 기간, 예: '2026-11-03 ~ 2026-11-09 (7일)'"},
        "insights": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "finding": {"type": "string", "description": "무엇을 발견했고 왜 중요한지 2~3문장"},
                    "evidence": {"type": "array", "items": _EVIDENCE},
                    "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
                    "sample_note": {"type": "string", "description": "판단에 쓴 표본 크기. 표본이 충분하면 빈 문자열"},
                },
                "required": ["title", "finding", "evidence", "confidence", "sample_note"],
                "additionalProperties": False,
            },
        },
        "actions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "priority": {"type": "integer", "description": "1 이 가장 먼저"},
                    "action": {"type": "string"},
                    "reason": {"type": "string"},
                    "expected_effect": {"type": "string", "description": "효과를 확인할 지표와 기대 변화"},
                    "effort": {"type": "string", "enum": ["low", "medium", "high"]},
                },
                "required": ["priority", "action", "reason", "expected_effect", "effort"],
                "additionalProperties": False,
            },
        },
        "data_gaps": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["headline", "period", "insights", "actions", "data_gaps"],
    "additionalProperties": False,
}
