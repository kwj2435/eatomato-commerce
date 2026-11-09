"""작업 큐 워커: 백엔드에서 대기 실행을 가져와(claim) 에이전트를 돌리고 결과를 돌려준다(complete).

외부로 포트를 열지 않고 백엔드에 몇 초마다 묻는 방식이다. 실패해도 워커는 멈추지 않고, 실패 사유를 실행 기록에 남긴다.
"""

from __future__ import annotations

import logging
import signal
import time
from typing import Any

import anthropic

from .agent import AgentError, run_agent
from .backend import BackendClient, BackendError
from .config import Settings
from .data import Dataset

log = logging.getLogger("insight_agent")


def process(run: dict, backend: BackendClient, client: Any, settings: Settings) -> None:
    """실행 하나를 처리하고 결과(DONE·FAILED)를 백엔드에 보낸다."""
    run_id = run["id"]
    started = time.perf_counter()
    if not settings.api_key_configured:
        backend.complete(run_id, {"status": "FAILED", "model": settings.model,
                                  "error": "AI API 키가 설정되지 않았습니다. 서버의 backend/.env 에 ANTHROPIC_API_KEY 를 넣어 주세요."})
        return
    try:
        dataset = Dataset.from_json(backend.dataset(settings.dataset_days))
        result = run_agent(client, dataset, backend.suggestion_context(), kind=run.get("kind", "MANUAL"),
                           model=settings.model, max_tool_calls=settings.max_tool_calls, max_turns=settings.max_turns)
    except Exception as e:  # noqa: BLE001 - 어떤 실패든 실행 기록에 남기고 워커는 계속 돈다
        message = _user_message(e)
        log.warning("분석 실패 run=%s: %s", run_id, e)
        backend.complete(run_id, {"status": "FAILED", "error": message, "model": settings.model})
        return

    backend.complete(run_id, {
        "status": "DONE",
        "report": result.report,
        "trace": result.trace,
        "model": result.model,
        "inputTokens": result.input_tokens,
        "outputTokens": result.output_tokens,
        "toolCalls": result.tool_calls,
    })
    log.info("분석 완료 run=%s 새 제안 %d개 도구 %d회 토큰 입력 %d·출력 %d (%.1fs)", run_id,
             len(result.report.get("suggestions", [])), result.tool_calls, result.input_tokens, result.output_tokens,
             time.perf_counter() - started)


def _user_message(error: Exception) -> str:
    """관리자 화면에 보일 실패 사유. API 키·내부 주소 같은 것은 드러내지 않는다."""
    if isinstance(error, AgentError):
        return str(error)
    if isinstance(error, anthropic.AuthenticationError):
        return "AI API 키가 올바르지 않습니다. 서버 설정(ANTHROPIC_API_KEY)을 확인해 주세요."
    if isinstance(error, anthropic.RateLimitError):
        return "AI API 사용량 한도에 걸렸습니다. 잠시 뒤 다시 요청해 주세요."
    if isinstance(error, anthropic.APIStatusError) and error.status_code == 400:
        return "AI API 가 요청을 거절했습니다(설정 확인 필요)."
    if isinstance(error, (anthropic.APIConnectionError, anthropic.APIStatusError)):
        return "AI API 에 연결하지 못했습니다. 잠시 뒤 다시 요청해 주세요."
    if isinstance(error, BackendError):
        return "분석 데이터를 불러오지 못했습니다."
    return "분석 중 오류가 났습니다. 다시 요청해 주세요."


def serve(settings: Settings) -> None:
    backend = BackendClient(settings.backend_url, settings.agent_token)
    client = anthropic.Anthropic()
    stopping = False

    def stop(*_: Any) -> None:
        nonlocal stopping
        stopping = True
        log.info("종료 신호를 받았습니다. 진행 중인 분석을 마치고 끝냅니다.")

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    log.info("워커 시작: backend=%s model=%s", settings.backend_url, settings.model)
    if not settings.api_key_configured:
        log.error("ANTHROPIC_API_KEY 가 없습니다. 요청은 모두 실패 처리됩니다.")

    while not stopping:
        try:
            run = backend.claim()
        except BackendError as e:
            log.warning("작업 확인 실패(백엔드 기동 중일 수 있음): %s", e)
            run = None
        if run:
            try:
                process(run, backend, client, settings)
            except BackendError as e:
                # 결과를 못 보냈으면 백엔드가 시간 초과로 실패 처리한다(InsightRunService.failStale).
                log.error("결과 전송 실패 run=%s: %s", run["id"], e)
            continue
        for _ in range(settings.poll_seconds):
            if stopping:
                break
            time.sleep(1)
