"""명령줄.

  insight-agent worker                       작업 큐 워커(운영)
  insight-agent snapshot --out data.json     원자료·지난 제안을 파일로 저장(같은 데이터로 모델 비교·평가할 때)
  insight-agent run [--dataset data.json] [--model ...] [--out result.json]
                                             오늘의 제안을 바로 만들어 본다(로컬 실험용, 작업 큐·보드에 저장하지 않음)
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
    trial = commands.add_parser("run")
    trial.add_argument("--dataset", type=Path, help="snapshot 으로 저장한 파일(없으면 백엔드에서 받음)")
    trial.add_argument("--model")
    trial.add_argument("--out", type=Path)
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

    if args.command == "worker":
        serve(Settings.from_env())
        return

    if args.command == "snapshot":
        settings = Settings.from_env()
        backend = BackendClient(settings.backend_url, settings.agent_token)
        raw = {"dataset": backend.dataset(settings.dataset_days), "context": backend.suggestion_context()}
        args.out.write_text(json.dumps(raw, ensure_ascii=False), encoding="utf-8")
        print(f"저장: {args.out} ({json.dumps(Dataset.from_json(raw['dataset']).summary(), ensure_ascii=False)})")
        return

    if args.dataset:
        saved = json.loads(args.dataset.read_text(encoding="utf-8"))
        raw, context = saved["dataset"], saved.get("context", {})
        model = args.model or "claude-haiku-5-5"
        max_tool_calls, max_turns = 12, 10
    else:
        settings = Settings.from_env()
        backend = BackendClient(settings.backend_url, settings.agent_token)
        raw, context = backend.dataset(settings.dataset_days), backend.suggestion_context()
        model = args.model or settings.model
        max_tool_calls, max_turns = settings.max_tool_calls, settings.max_turns
    result = run_agent(anthropic.Anthropic(), Dataset.from_json(raw), context, model=model,
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
