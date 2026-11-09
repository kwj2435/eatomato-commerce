"""에이전트 루프를 가짜 Claude 클라이언트로 검증한다(실제 API 를 부르지 않음)."""

import json
from types import SimpleNamespace

import pytest

from insight_agent.agent import AgentError, run_agent, verify_evidence


def usage(i=100, o=20, cache_read=0):
    return SimpleNamespace(input_tokens=i, output_tokens=o, cache_read_input_tokens=cache_read,
                           cache_creation_input_tokens=0)


def tool_use(tool_id, name, params):
    return SimpleNamespace(type="tool_use", id=tool_id, name=name, input=params)


def text(value):
    return SimpleNamespace(type="text", text=value)


def response(content, stop_reason="end_turn", u=None):
    return SimpleNamespace(content=content, stop_reason=stop_reason, usage=u or usage())


REPORT = {
    "summary": "인스타 post-a 유입이 구매로 이어졌어요",
    "period": "2026-11-03 ~ 2026-11-09 (7일)",
    "suggestions": [{
        "category": "marketing",
        "title": "post-a 와 같은 형식의 게시물을 하나 더 올린다",
        "problem": "post-a 로 들어온 방문의 결제 전환이 높습니다.",
        "proposal": "착용 사진과 가격을 넣은 게시물을 올린다",
        "evidence": [
            {"metric": "결제 완료 방문", "value": "2회"},
            {"metric": "지어낸 숫자", "value": "37.5%"},
            {"metric": "설명", "value": "높음"},
        ],
        "metric": "새 게시물 캠페인 결제 전환 10% 이상",
        "impact": "medium", "effort": "low", "confidence": "low",
    }],
    "reconfirmed": [],
    "follow_ups": [{"id": 3, "verdict": "insufficient_data", "summary": "완료 후 기간이 짧음",
                    "evidence": [{"metric": "완료 후 방문", "value": "30회"}]}],
    "data_gaps": ["게시물 비용 없음"],
}

CONTEXT = {"items": [{"id": 3, "category": "DESIGN", "title": "담기 버튼 안내", "status": "DONE", "createdOn": "2026-10-20"}],
           "followUpDue": [{"id": 3, "title": "담기 버튼 안내", "metric": "담기 비율", "doneOn": "2026-11-05"}]}


class FakeClient:
    """정해 둔 응답을 차례로 돌려주고, 받은 요청을 기록한다."""

    def __init__(self, responses):
        self._responses = list(responses)
        self.requests = []
        self.messages = self

    def create(self, **params):
        # 이후 턴에서 messages 가 늘어나므로 그 시점 내용을 복사해 둔다
        self.requests.append({**params, "messages": list(params["messages"])})
        return self._responses.pop(0)


def test_tool_call_then_report(ds):
    client = FakeClient([
        response([tool_use("t1", "overview", {"days": 7})], "tool_use", usage(1000, 50)),
        response([text(json.dumps(REPORT, ensure_ascii=False))], u=usage(1500, 400, cache_read=800)),
    ])
    result = run_agent(client, ds, CONTEXT, kind="DAILY", model="claude-haiku-5-5")

    assert result.report["summary"] == REPORT["summary"]
    assert result.tool_calls == 1
    assert result.input_tokens == 1000 + 1500 + 800
    assert result.output_tokens == 450
    assert result.trace[0]["tool"] == "overview" and result.trace[0]["input"] == {"days": 7}
    assert "ms" in result.trace[0] and "preview" in result.trace[0]

    first = client.requests[0]
    assert first["model"] == "claude-haiku-5-5"
    assert first["output_config"]["format"]["type"] == "json_schema"
    assert "tool_choice" not in first
    first_message = first["messages"][0]["content"]
    assert "매일 아침 자동 분석" in first_message
    assert "담기 버튼 안내" in first_message and "follow_up_due" in first_message
    # 두 번째 요청에 도구 결과가 JSON 으로 담긴다
    tool_result = client.requests[1]["messages"][-1]["content"][0]
    assert tool_result["tool_use_id"] == "t1"
    assert json.loads(tool_result["content"])["current"]["purchase_sessions"] == 2

    # 도구 결과에 없는 숫자(37.5)는 확인 필요로 표시된다. 숫자가 없는 근거는 세지 않는다. 효과 확인 근거도 센다.
    verification = result.report["verification"]
    assert verification["checked"] == 3
    assert [u["metric"] for u in verification["unverified"]] == ["지어낸 숫자"]


def test_manual_run_without_context(ds):
    client = FakeClient([response([text(json.dumps(REPORT, ensure_ascii=False))])])
    run_agent(client, ds, None, model="m")
    message = client.requests[0]["messages"][0]["content"]
    assert "관리자가 지금 분석을 요청함" in message and "지난 제안" in message


def test_tool_budget_is_enforced(ds):
    client = FakeClient([
        response([tool_use("t1", "overview", {"days": 7}), tool_use("t2", "time_patterns", {"days": 7})], "tool_use"),
        response([text(json.dumps(REPORT, ensure_ascii=False))]),
    ])
    result = run_agent(client, ds, None, model="m", max_tool_calls=1)

    results = client.requests[1]["messages"][-1]["content"]
    assert "is_error" not in results[0]
    assert results[1]["is_error"] is True and "한도" in results[1]["content"]
    # 한도를 다 쓰면 다음 요청은 도구 없이 리포트를 쓰게 한다
    assert client.requests[1]["tool_choice"] == {"type": "none"}
    assert result.tool_calls == 1
    assert result.trace[1]["error"] == "도구 호출 한도 초과"


def test_last_turn_forbids_tools(ds):
    client = FakeClient([
        response([tool_use("t1", "overview", {"days": 7})], "tool_use"),
        response([text(json.dumps(REPORT, ensure_ascii=False))]),
    ])
    run_agent(client, ds, None, model="m", max_turns=2)
    assert "tool_choice" not in client.requests[0]
    assert client.requests[1]["tool_choice"] == {"type": "none"}


def test_bad_tool_input_is_returned_as_error(ds):
    client = FakeClient([
        response([tool_use("t1", "overview", {"days": 365})], "tool_use"),
        response([text(json.dumps(REPORT, ensure_ascii=False))]),
    ])
    result = run_agent(client, ds, None, model="m")
    error = client.requests[1]["messages"][-1]["content"][0]
    assert error["is_error"] is True and "1~90" in error["content"]
    assert "1~90" in result.trace[0]["error"]


@pytest.mark.parametrize("stop_reason, message", [("refusal", "답하지 않았습니다"), ("max_tokens", "끊겼습니다")])
def test_stop_reasons_fail_with_readable_message(ds, stop_reason, message):
    client = FakeClient([response([text("")], stop_reason)])
    with pytest.raises(AgentError, match=message):
        run_agent(client, ds, None, model="m")


def test_invalid_report_fails(ds):
    client = FakeClient([response([text("리포트가 아닌 글")])])
    with pytest.raises(AgentError, match="읽지 못했습니다"):
        run_agent(client, ds, None, model="m")


def test_runs_out_of_turns(ds):
    client = FakeClient([response([tool_use(f"t{i}", "overview", {"days": 7})], "tool_use") for i in range(3)])
    with pytest.raises(AgentError, match="너무 길어져"):
        run_agent(client, ds, None, model="m", max_turns=3)


def test_verify_evidence_accepts_rounded_percent_and_commas():
    outputs = [json.dumps({"conversion_pct": 6.7, "revenue": 28000, "period": {"days": 7}})]
    report = {"suggestions": [{"evidence": [
        {"metric": "전환율", "value": "약 7%"},
        {"metric": "매출", "value": "28,000원 (7일)"},
        {"metric": "전환율", "value": "6.7%"},
    ]}]}
    assert verify_evidence(report, outputs) == {"checked": 3, "unverified": []}
