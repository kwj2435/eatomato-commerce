"""에이전트 루프.

SDK 의 tool runner 대신 루프를 직접 쓴다. 실행마다 도구 호출 수·턴 수 상한을 걸고, 단계별 기록(trace)과
토큰 사용량을 남겨 평가·비용 확인에 쓰기 위해서다.

흐름: 사용자 메시지(요청 + 데이터 범위) → Claude 가 도구 호출 → pandas 로 집계해 결과 전달 → … → 리포트(JSON 스키마)
"""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass, field
from typing import Any

from .data import Dataset
from .prompts import REPORT_SCHEMA, SYSTEM_PROMPT, task_message
from .tools import TOOL_DEFINITIONS, ToolInputError, run_tool

MAX_TOKENS = 16000
_TRACE_PREVIEW = 300


class AgentError(Exception):
    """에이전트가 리포트를 만들지 못함. 메시지는 관리자 화면에 그대로 보인다."""


@dataclass
class AgentResult:
    report: dict
    trace: list[dict]
    model: str
    input_tokens: int
    output_tokens: int
    tool_calls: int


@dataclass
class _Run:
    trace: list[dict] = field(default_factory=list)
    tool_outputs: list[str] = field(default_factory=list)
    input_tokens: int = 0
    output_tokens: int = 0
    tool_calls: int = 0

    def add_usage(self, usage: Any) -> None:
        # 캐시에서 읽거나 캐시에 쓴 입력도 입력 토큰으로 센다(비용 계산은 따로).
        self.input_tokens += sum(
            getattr(usage, key, 0) or 0
            for key in ("input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens")
        )
        self.output_tokens += getattr(usage, "output_tokens", 0) or 0


def run_agent(client: Any, ds: Dataset, question: str | None, *, model: str, max_tool_calls: int = 12,
              max_turns: int = 10) -> AgentResult:
    run = _Run()
    today = ds.end.date().isoformat()
    messages: list[dict] = [{"role": "user", "content": task_message(question, ds.summary(), today)}]

    for turn in range(max_turns):
        params: dict[str, Any] = {
            "model": model,
            "max_tokens": MAX_TOKENS,
            "system": SYSTEM_PROMPT,
            "tools": TOOL_DEFINITIONS,
            "messages": messages,
            "output_config": {"format": {"type": "json_schema", "schema": REPORT_SCHEMA}},
            # 시스템 프롬프트·도구 정의가 매 턴 같으므로 캐시해 입력 비용을 줄인다.
            "cache_control": {"type": "ephemeral"},
        }
        # 도구를 다 썼거나 마지막 턴이면 도구 없이 리포트를 쓰게 한다.
        if run.tool_calls >= max_tool_calls or turn == max_turns - 1:
            params["tool_choice"] = {"type": "none"}

        response = client.messages.create(**params)
        run.add_usage(response.usage)

        if response.stop_reason == "refusal":
            raise AgentError("AI 가 이 요청에 답하지 않았습니다. 질문을 바꿔 다시 요청해 주세요.")
        if response.stop_reason == "max_tokens":
            raise AgentError("리포트가 너무 길어 중간에 끊겼습니다. 질문 범위를 좁혀 다시 요청해 주세요.")
        if response.stop_reason == "pause_turn":
            messages.append({"role": "assistant", "content": response.content})
            continue

        tool_uses = [block for block in response.content if block.type == "tool_use"]
        if not tool_uses:
            report = _parse_report(response.content)
            report["verification"] = verify_evidence(report, run.tool_outputs)
            return AgentResult(report, run.trace, model, run.input_tokens, run.output_tokens, run.tool_calls)

        # 도구 결과는 한 사용자 메시지에 모두 담아 돌려준다(병렬 호출 유지).
        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": [
            _execute(ds, run, block, max_tool_calls, turn) for block in tool_uses
        ]})

    raise AgentError("분석 단계가 너무 길어져 중단했습니다. 다시 요청해 주세요.")


def _execute(ds: Dataset, run: _Run, block: Any, max_tool_calls: int, turn: int) -> dict:
    entry: dict[str, Any] = {"turn": turn, "tool": block.name, "input": block.input}
    if run.tool_calls >= max_tool_calls:
        entry["error"] = "도구 호출 한도 초과"
        run.trace.append(entry)
        return {"type": "tool_result", "tool_use_id": block.id, "is_error": True,
                "content": "도구 호출 한도에 도달했습니다. 지금까지의 결과로 리포트를 작성하세요."}

    run.tool_calls += 1
    started = time.perf_counter()
    try:
        output = json.dumps(run_tool(ds, block.name, block.input), ensure_ascii=False, default=str)
    except ToolInputError as e:
        entry.update(error=str(e), ms=_ms(started))
        run.trace.append(entry)
        return {"type": "tool_result", "tool_use_id": block.id, "is_error": True, "content": str(e)}

    run.tool_outputs.append(output)
    entry.update(ms=_ms(started), preview=output[:_TRACE_PREVIEW])
    run.trace.append(entry)
    return {"type": "tool_result", "tool_use_id": block.id, "content": output}


def _ms(started: float) -> int:
    return round((time.perf_counter() - started) * 1000)


def _parse_report(content: list) -> dict:
    text = "".join(block.text for block in content if block.type == "text").strip()
    try:
        report = json.loads(text)
    except json.JSONDecodeError as e:
        raise AgentError("AI 응답을 리포트로 읽지 못했습니다. 다시 요청해 주세요.") from e
    if not isinstance(report, dict) or not {"headline", "insights", "actions"} <= report.keys():
        raise AgentError("AI 응답에 리포트 항목이 빠져 있습니다. 다시 요청해 주세요.")
    return report


# ── 근거 숫자 확인 ────────────────────────────────────────────────

_NUMBER = re.compile(r"-?\d[\d,]*(?:\.\d+)?")


def _numbers(text: str) -> set[str]:
    """문자열 속 숫자를 정규화해 모은다(쉼표 제거, 1.0 → 1)."""
    found = set()
    for raw in _NUMBER.findall(text):
        value = float(raw.replace(",", ""))
        found.add(_normalize(value))
    return found


def _normalize(value: float) -> str:
    return str(int(value)) if value == int(value) else f"{value:.1f}".rstrip("0").rstrip(".")


def verify_evidence(report: dict, tool_outputs: list[str]) -> dict:
    """리포트 근거(evidence)의 숫자가 도구 결과에 실제로 있는지 확인한다.

    도구 결과에 없는 숫자는 AI 가 계산했거나 지어낸 것이다. 리포트를 막지는 않고 화면에 표시해
    운영자가 직접 확인하게 한다. 날짜·기간 같은 숫자도 도구 결과에 있으므로 함께 맞춰 본다.
    """
    known: set[str] = set()
    for output in tool_outputs:
        known |= _numbers(output)
        # 비율은 도구가 소수 첫째 자리로 주므로 AI 가 반올림한 정수도 인정한다.
        known |= {_normalize(round(float(n))) for n in _numbers(output) if "." in n}

    checked = 0
    unverified = []
    for insight in report.get("insights", []):
        for evidence in insight.get("evidence", []):
            numbers = _numbers(str(evidence.get("value", "")))
            if not numbers:
                continue
            checked += 1
            missing = sorted(numbers - known)
            if missing:
                unverified.append({"metric": evidence.get("metric", ""), "value": evidence.get("value", ""),
                                   "numbers_not_in_tool_results": missing})
    return {"checked": checked, "unverified": unverified}
