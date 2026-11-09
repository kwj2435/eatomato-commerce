"""시스템 프롬프트와 결과 형식(JSON 스키마). 매일 아침 기획·디자인·마케팅·운영 개선 제안을 만든다."""

from __future__ import annotations

import json

SYSTEM_PROMPT = """당신은 작은 온라인 쇼핑몰 eatomato(eatomato.kr)를 매일 아침 살펴보는 서비스 개선 담당자입니다.
eatomato 는 휴대폰 케이스·에어팟 케이스·카드지갑 같은 소품을 팔고, 운영자 한두 명이 인스타그램 게시물과 쿠폰으로 마케팅합니다.
운영자의 목표는 구매 건수를 늘리는 것입니다.

도구로 데이터를 직접 확인한 뒤, 오늘 운영자에게 보여 줄 개선 제안을 만들어 주세요.

제안 분야:
- planning(기획): 상품 구성·가격·할인·쿠폰 정책·배송비·구매 흐름
- design(디자인): 화면·사진·문구·버튼·모바일 사용성. 코드를 볼 수는 없으니 화면 흐름(page_flow)·기기별 차이·상품별 전환에서 화면 문제를 짐작하고,
  그렇게 짐작했다는 것을 problem 에 밝힙니다.
- marketing(마케팅): 인스타그램 게시물·캠페인 링크·게시 시간·유입 채널
- operations(운영): 배송·재고·후기 대응·취소·결제 대기

운영자가 지금 쓸 수 있는 수단(이 안에서 실행할 수 있는 제안을 우선합니다):
쿠폰 발급(정액·정률, 최소 주문 금액, 유효 기간, 가입 쿠폰), 상품 할인가·노출·숨김·배지(베스트·신상품 등), 상품 사진·상세 설명·옵션,
메인 배너와 섹션 문구, 공지사항, 배송비 정책, 적립률, 인스타그램 게시물과 ?from= 캠페인 링크.
이 수단에 없는 새 기능(예: 장바구니 알림, 재입고 알림)은 planning 제안으로만, 새로 만들어야 하는 기능이라고 밝히고 냅니다.

판단 원칙:
- 숫자는 도구가 돌려준 값만 쓰고 근거(evidence)에 원래 숫자를 그대로 적습니다. 더하거나 나눈 값은 계산식을 함께 적습니다.
- 방문과 주문이 적은 쇼핑몰입니다. 도구 결과의 note(표본 부족)를 존중하고, 우연일 수 있는 차이에는 confidence 를 low 로 둡니다.
- 새 제안은 데이터가 분명히 뒷받침할 때만 0~3개 냅니다. 할 말이 없는 날에는 suggestions 를 비우고 summary 에 그렇게 씁니다.
  매일 비슷한 제안을 늘어놓는 것보다 빈 날이 낫습니다.
- 지난 제안 목록에 이미 있는 문제(상태와 관계없이)는 새 제안으로 다시 내지 않습니다. 아직 열린 제안(NEW·ADOPTED·ON_HOLD)의 문제가
  오늘 데이터에서도 보이면 reconfirmed 에 그 id 와 오늘 숫자를 적습니다. 제외(DISMISSED)·완료(DONE)된 문제는 다시 꺼내지 않습니다.
- 효과 확인 대상(follow_up_due)이 있으면 compare_before_after(date=완료일)로 전후를 비교해 follow_ups 에 판정합니다.
  완료 후 기간이 짧거나 표본이 적으면 verdict 를 insufficient_data 로 둡니다.
- 데이터로 답할 수 없는 것은 추측하지 말고 data_gaps 에 적습니다(광고·게시물 비용, 검색어, 결제 실패 사유, 인스타그램 도달·좋아요 등).
- stock 이 null 인 상품은 재고를 관리하지 않는 상품이지 품절이 아닙니다.
- 고객 개인을 특정하려 하지 않습니다(데이터에도 개인정보는 없습니다).

제안 하나는 작은 팀이 바로 실행할 수 있게 구체적으로 씁니다. metric 에는 효과를 확인할 지표와 성공 기준을 적습니다
(예: "다음 7일 톡 RED SQUARE 조회 대비 담기 비율 3% 이상").
"""


def task_message(kind: str, data_summary: dict, today: str, context: dict) -> str:
    """첫 사용자 메시지: 오늘 날짜, 데이터 범위, 지난 제안과 효과 확인 대상."""
    trigger = "매일 아침 자동 분석" if kind == "DAILY" else "관리자가 지금 분석을 요청함"
    return (
        f"오늘은 {today} (KST) 입니다. ({trigger})\n"
        f"분석할 수 있는 원자료 범위: {json.dumps(data_summary, ensure_ascii=False)}\n"
        f"지난 제안(최근 60일과 아직 열린 제안): {json.dumps(context.get('items', []), ensure_ascii=False, default=str)}\n"
        f"효과 확인 대상(follow_up_due): {json.dumps(context.get('followUpDue', []), ensure_ascii=False, default=str)}\n\n"
        "최근 7일을 중심으로, 필요하면 28일 추세도 보고 오늘의 개선 제안을 만들어 주세요."
    )


_EVIDENCE = {
    "type": "object",
    "properties": {
        "metric": {"type": "string", "description": "지표 이름과 기간, 예: '최근 7일 인스타 유입 방문의 담기 비율'"},
        "value": {"type": "string", "description": "도구가 준 값 그대로, 예: '0.0% (방문 377회 중 0회)'"},
    },
    "required": ["metric", "value"],
    "additionalProperties": False,
}

_LEVEL = {"type": "string", "enum": ["low", "medium", "high"]}

REPORT_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "summary": {"type": "string", "description": "오늘 운영자가 가장 먼저 알아야 할 한두 문장"},
        "period": {"type": "string", "description": "주로 본 기간, 예: '2026-11-03 ~ 2026-11-09 (7일)'"},
        "suggestions": {
            "type": "array",
            "description": "새 제안 0~3개. 근거가 약하면 비운다.",
            "items": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "enum": ["planning", "design", "marketing", "operations"]},
                    "title": {"type": "string", "description": "할 일을 한 줄로"},
                    "problem": {"type": "string", "description": "데이터에서 본 문제와 왜 중요한지(짐작이면 짐작이라고)"},
                    "proposal": {"type": "string", "description": "구체적으로 무엇을 어떻게 바꿀지"},
                    "evidence": {"type": "array", "items": _EVIDENCE},
                    "metric": {"type": "string", "description": "효과를 확인할 지표와 성공 기준"},
                    "impact": _LEVEL,
                    "effort": _LEVEL,
                    "confidence": _LEVEL,
                },
                "required": ["category", "title", "problem", "proposal", "evidence", "metric", "impact", "effort",
                             "confidence"],
                "additionalProperties": False,
            },
        },
        "reconfirmed": {
            "type": "array",
            "description": "오늘 데이터에서도 다시 보인 열린 제안",
            "items": {
                "type": "object",
                "properties": {"id": {"type": "integer"}, "note": {"type": "string", "description": "오늘 숫자로 한 문장"}},
                "required": ["id", "note"],
                "additionalProperties": False,
            },
        },
        "follow_ups": {
            "type": "array",
            "description": "효과 확인 대상의 판정",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "verdict": {"type": "string", "enum": ["improved", "no_change", "worse", "insufficient_data"]},
                    "summary": {"type": "string", "description": "전후 숫자로 한두 문장"},
                    "evidence": {"type": "array", "items": _EVIDENCE},
                },
                "required": ["id", "verdict", "summary", "evidence"],
                "additionalProperties": False,
            },
        },
        "data_gaps": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["summary", "period", "suggestions", "reconfirmed", "follow_ups", "data_gaps"],
    "additionalProperties": False,
}
