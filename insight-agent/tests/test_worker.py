import json

import anthropic
import httpx2

from insight_agent.config import Settings
from insight_agent.worker import process

from .test_agent import REPORT, FakeClient, response, text, tool_use

SETTINGS = Settings(backend_url="http://backend", agent_token="t", model="claude-haiku-5-5", max_tool_calls=12,
                    max_turns=10, poll_seconds=5, dataset_days=90)


class FakeBackend:
    def __init__(self, raw):
        self.raw = raw
        self.completed = []

    def dataset(self, days):
        assert days == 90
        return self.raw

    def complete(self, run_id, payload):
        self.completed.append((run_id, payload))


def test_done_payload(raw):
    backend = FakeBackend(raw)
    client = FakeClient([
        response([tool_use("t1", "overview", {"days": 7})], "tool_use"),
        response([text(json.dumps(REPORT, ensure_ascii=False))]),
    ])
    process({"id": 7, "question": None}, backend, client, SETTINGS)

    run_id, payload = backend.completed[0]
    assert run_id == 7
    assert payload["status"] == "DONE"
    assert payload["report"]["headline"] == REPORT["headline"]
    assert payload["toolCalls"] == 1 and payload["model"] == "claude-haiku-5-5"
    assert payload["trace"][0]["tool"] == "overview"
    # 백엔드로 보내는 값은 JSON 으로 직렬화할 수 있어야 한다
    json.dumps(payload, ensure_ascii=False)


def test_agent_failure_is_reported_without_internal_details(raw):
    backend = FakeBackend(raw)
    client = FakeClient([response([text("")], "refusal")])
    process({"id": 8, "question": "q"}, backend, client, SETTINGS)
    _, payload = backend.completed[0]
    assert payload["status"] == "FAILED"
    assert "답하지 않았습니다" in payload["error"]


def test_api_key_error_message(raw):
    class BadKeyClient:
        def __init__(self):
            self.messages = self

        def create(self, **params):
            request = httpx2.Request("POST", "https://api.anthropic.com/v1/messages")
            raise anthropic.AuthenticationError("invalid x-api-key sk-ant-secret",
                                                response=httpx2.Response(401, request=request), body=None)

    backend = FakeBackend(raw)
    process({"id": 9, "question": None}, backend, BadKeyClient(), SETTINGS)
    _, payload = backend.completed[0]
    assert payload["status"] == "FAILED"
    assert "API 키가 올바르지 않습니다" in payload["error"]
    assert "sk-ant" not in payload["error"]


def test_missing_api_key_fails_clearly_without_calling_ai(raw):
    from dataclasses import replace

    backend = FakeBackend(raw)
    client = FakeClient([])  # 호출되면 pop 에서 실패한다
    process({"id": 10, "question": None}, backend, client, replace(SETTINGS, api_key_configured=False))
    _, payload = backend.completed[0]
    assert payload["status"] == "FAILED"
    assert "ANTHROPIC_API_KEY" in payload["error"]
    assert client.requests == []
