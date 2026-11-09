"""환경 변수 설정. ANTHROPIC_API_KEY 는 SDK 가 직접 읽는다."""

from __future__ import annotations

import os
from dataclasses import dataclass


def _int(name: str, default: int) -> int:
    value = os.environ.get(name, "").strip()
    return int(value) if value else default


@dataclass(frozen=True)
class Settings:
    backend_url: str
    agent_token: str
    model: str
    max_tool_calls: int
    max_turns: int
    poll_seconds: int
    dataset_days: int
    # 키가 없으면 SDK 가 일반 TypeError 를 내 원인을 알기 어렵다. 미리 확인해 분명한 메시지로 실패시킨다.
    api_key_configured: bool = True

    @classmethod
    def from_env(cls) -> "Settings":
        token = os.environ.get("INSIGHT_AGENT_TOKEN", "").strip()
        if not token:
            raise SystemExit("INSIGHT_AGENT_TOKEN 이 필요합니다(백엔드 app.insight.agent-token 과 같은 값).")
        return cls(
            backend_url=os.environ.get("BACKEND_URL", "http://localhost:8080").rstrip("/"),
            agent_token=token,
            # 비용을 낮추려고 기본은 가장 싼 모델. 품질 비교 뒤 바꿀 수 있게 설정으로 둔다.
            model=os.environ.get("INSIGHT_MODEL", "claude-haiku-5-5"),
            max_tool_calls=_int("INSIGHT_MAX_TOOL_CALLS", 12),
            max_turns=_int("INSIGHT_MAX_TURNS", 10),
            poll_seconds=_int("INSIGHT_POLL_SECONDS", 5),
            # 방문 기록은 3개월만 남는다. 90일을 받아 두면 28일 + 직전 28일 비교까지 할 수 있다.
            dataset_days=_int("INSIGHT_DATASET_DAYS", 90),
            api_key_configured=bool(os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")),
        )
