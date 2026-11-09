"""명령줄.

  insight-agent worker                       작업 큐 워커(운영)
  insight-agent snapshot --out data.json     원자료를 파일로 저장(같은 데이터로 모델 비교·평가할 때)
  insight-agent ask "질문" [--dataset data.json] [--model ...] [--out report.json]
                                             질문 하나를 바로 분석(로컬 실험용, 작업 큐를 거치지 않음)
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

import anthropic

from .agent import run_agent
from .backend import BackendClient
from .config import Settings
from .data import Dataset
from .worker import serve


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="insight-agent")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("worker")
    snapshot = commands.add_parser("snapshot")
    snapshot.add_argument("--out", required=True, type=Path)
    ask = commands.add_parser("ask")
    ask.add_argument("question", nargs="?", default=None, help="비우면 주간 리포트")
    ask.add_argument("--dataset", type=Path, help="snapshot 으로 저장한 원자료(없으면 백엔드에서 받음)")
    ask.add_argument("--model")
    ask.add_argument("--out", type=Path)
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

    if args.command == "worker":
        serve(Settings.from_env())
        return

    if args.command == "snapshot":
        settings = Settings.from_env()
        raw = BackendClient(settings.backend_url, settings.agent_token).dataset(settings.dataset_days)
        args.out.write_text(json.dumps(raw, ensure_ascii=False), encoding="utf-8")
        print(f"저장: {args.out} ({json.dumps(Dataset.from_json(raw).summary(), ensure_ascii=False)})")
        return

    if args.dataset:
        raw = json.loads(args.dataset.read_text(encoding="utf-8"))
        model = args.model or "claude-haiku-5-5"
        max_tool_calls, max_turns = 12, 10
    else:
        settings = Settings.from_env()
        raw = BackendClient(settings.backend_url, settings.agent_token).dataset(settings.dataset_days)
        model = args.model or settings.model
        max_tool_calls, max_turns = settings.max_tool_calls, settings.max_turns
    result = run_agent(anthropic.Anthropic(), Dataset.from_json(raw), args.question, model=model,
                       max_tool_calls=max_tool_calls, max_turns=max_turns)
    output = {"model": result.model, "toolCalls": result.tool_calls, "inputTokens": result.input_tokens,
              "outputTokens": result.output_tokens, "report": result.report, "trace": result.trace}
    text = json.dumps(output, ensure_ascii=False, indent=2)
    if args.out:
        args.out.write_text(text, encoding="utf-8")
        print(f"저장: {args.out}")
    else:
        sys.stdout.write(text + "\n")


if __name__ == "__main__":
    main()
