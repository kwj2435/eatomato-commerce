"""Java 백엔드 내부 API(/internal/insights) 연결. 표준 라이브러리만 쓴다."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any

TOKEN_HEADER = "X-Internal-Token"


class BackendError(Exception):
    pass


class BackendClient:
    def __init__(self, base_url: str, token: str, timeout: float = 30.0) -> None:
        self._base = base_url.rstrip("/")
        self._token = token
        self._timeout = timeout

    def _request(self, method: str, path: str, body: Any = None) -> tuple[int, Any]:
        data = None if body is None else json.dumps(body, ensure_ascii=False, default=str).encode()
        request = urllib.request.Request(
            self._base + path,
            data=data,
            method=method,
            headers={TOKEN_HEADER: self._token, "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(request, timeout=self._timeout) as response:
                raw = response.read()
                return response.status, json.loads(raw) if raw else None
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:300]
            raise BackendError(f"{method} {path} → {e.code} {detail}") from e
        except urllib.error.URLError as e:
            raise BackendError(f"{method} {path} → 연결 실패: {e.reason}") from e

    def claim(self) -> dict | None:
        """대기 중인 실행 하나. 없으면 None."""
        status, data = self._request("POST", "/internal/insights/runs/claim")
        return data if status == 200 else None

    def suggestion_context(self) -> dict:
        """지난 제안(중복 방지)과 효과를 확인할 완료 제안."""
        _, data = self._request("GET", "/internal/insights/suggestions/context")
        return data

    def dataset(self, days: int) -> dict:
        _, data = self._request("GET", f"/internal/insights/dataset?days={days}")
        return data

    def complete(self, run_id: int, payload: dict) -> None:
        self._request("POST", f"/internal/insights/runs/{run_id}/complete", payload)
