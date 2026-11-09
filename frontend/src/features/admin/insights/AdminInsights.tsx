"use client";

import { useCallback, useEffect, useState } from "react";

import { getInsightRun, listInsightRuns, requestInsightRun } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import type { InsightConfidence, InsightReport, InsightRun, InsightRunStatus, InsightTraceStep } from "@/types/admin";

import { formatDateTime } from "../format";
import { Button, Card, Chip, Empty, Notice, PageHeader, textareaClass } from "../ui";

const POLL_MS = 3000;

const STATUS_LABELS: Record<InsightRunStatus, string> = {
  PENDING: "대기 중",
  RUNNING: "분석 중",
  DONE: "완료",
  FAILED: "실패",
};

const CONFIDENCE: Record<InsightConfidence, { label: string; tone: "brand" | "neutral" | "muted" }> = {
  high: { label: "근거 충분", tone: "brand" },
  medium: { label: "참고", tone: "neutral" },
  low: { label: "표본 적음", tone: "muted" },
};

const EFFORT_LABELS = { low: "쉬움", medium: "보통", high: "큼" } as const;

const EXAMPLES = [
  "인스타 게시물 중 실제 구매로 이어진 건 뭐야?",
  "많이 보는데 안 팔리는 상품은?",
  "게시물은 언제 올리는 게 좋을까?",
];

const isActive = (run: InsightRun) => run.status === "PENDING" || run.status === "RUNNING";

/**
 * 마케팅 인사이트: 관리자가 요청하면 Python 에이전트(insight-agent)가 방문·주문·후기 데이터를 도구로 조회해
 * 근거 숫자가 붙은 리포트를 만든다. 요청은 백엔드 작업 큐에 쌓이고, 진행 중인 실행은 몇 초마다 다시 읽는다.
 */
export function AdminInsights() {
  const [runs, setRuns] = useState<InsightRun[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<InsightRun | null>(null);
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = useCallback(() => {
    listInsightRuns()
      .then((list) => {
        setRuns(list);
        setSelectedId((current) => current ?? list[0]?.id ?? null);
      })
      .catch((e: unknown) => setError(errorMessage(e)));
  }, []);

  useEffect(loadRuns, [loadRuns]);

  // 선택한 실행을 읽고, 진행 중이면 끝날 때까지 몇 초마다 다시 읽는다(끝나면 목록도 갱신).
  useEffect(() => {
    if (selectedId === null) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = () => {
      getInsightRun(selectedId)
        .then((run) => {
          if (cancelled) return;
          setDetail(run);
          if (isActive(run)) timer = setTimeout(poll, POLL_MS);
          else loadRuns();
        })
        .catch((e: unknown) => !cancelled && setError(errorMessage(e)));
    };
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedId, loadRuns]);

  const busy = runs?.some(isActive) ?? false;

  const submit = async (text?: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const run = await requestInsightRun(text?.trim() || undefined);
      setQuestion("");
      setRuns((prev) => [run, ...(prev ?? [])]);
      setDetail(null);
      setSelectedId(run.id);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="마케팅 인사이트"
        description="AI 에이전트가 방문·주문·후기 데이터를 직접 조회해 구매를 늘릴 방법을 제안합니다. 숫자는 분석 도구가 계산한 값이며, 도구 결과에서 확인되지 않은 숫자는 따로 표시합니다. 고객 개인정보는 AI 에 보내지 않습니다."
      />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          <div className="flex-1">
            <label htmlFor="insight-question" className="mb-1.5 block text-[13px] font-medium text-ink-muted">
              질문하기
            </label>
            <textarea
              id="insight-question"
              rows={2}
              maxLength={500}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={EXAMPLES[0]}
              className={textareaClass}
            />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setQuestion(example)}
                  className="rounded-full border border-black/10 px-2.5 py-1 text-[12px] text-ink-muted hover:bg-black/[0.04]"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 md:flex-col md:pt-6">
            <Button variant="primary" disabled={busy || submitting || !question.trim()} onClick={() => submit(question)}>
              질문하기
            </Button>
            <Button disabled={busy || submitting} onClick={() => submit()}>
              주간 리포트 만들기
            </Button>
          </div>
        </div>
        {busy ? <p className="mt-3 text-[12px] text-ink-subtle">진행 중인 분석이 끝나면 새로 요청할 수 있습니다.</p> : null}
        {error ? (
          <div className="mt-3">
            <Notice kind="error">{error}</Notice>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card title="분석 기록" className="lg:self-start">
          {!runs ? (
            <div className="h-40 animate-pulse rounded-md bg-black/[0.04]" />
          ) : runs.length === 0 ? (
            <Empty>아직 분석 기록이 없습니다.</Empty>
          ) : (
            <ul className="-mx-2 space-y-1">
              {runs.map((run) => (
                <li key={run.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(run.id)}
                    aria-current={run.id === selectedId ? "true" : undefined}
                    className={cn(
                      "w-full rounded-md px-2 py-2 text-left hover:bg-black/[0.04]",
                      run.id === selectedId && "bg-black/[0.05]",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-[13px] text-ink-primary">{run.question ?? "주간 리포트"}</span>
                      <span className="flex-none whitespace-nowrap">
                        <StatusChip status={run.status} />
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ink-subtle">{formatDateTime(run.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="min-w-0">
          {detail && detail.id === selectedId ? <RunDetail run={detail} /> : selectedId !== null ? (
            <div className="h-60 animate-pulse rounded-lg bg-black/[0.04]" />
          ) : null}
        </div>
      </div>
    </>
  );
}

function StatusChip({ status }: { status: InsightRunStatus }) {
  const tone = status === "FAILED" ? "brand" : status === "DONE" ? "muted" : "neutral";
  return <Chip tone={tone}>{STATUS_LABELS[status]}</Chip>;
}

function RunDetail({ run }: { run: InsightRun }) {
  const title = run.question ?? "주간 리포트";
  if (isActive(run)) {
    return (
      <Card title={title}>
        <p className="text-[14px] text-ink-body">
          {run.status === "PENDING" ? "분석을 기다리는 중입니다." : "AI 가 데이터를 조회하며 분석하고 있습니다."} 보통 1~2분 걸립니다.
        </p>
        <p className="mt-1 text-[12px] text-ink-subtle">
          오래 대기 상태로 남으면 서버의 분석 워커(insight-agent)가 꺼져 있는지 확인해 주세요. 15분이 지나면 자동으로 실패 처리됩니다.
        </p>
      </Card>
    );
  }
  if (run.status === "FAILED" || !run.report) {
    return (
      <Card title={title}>
        <Notice kind="error">{run.error ?? "분석에 실패했습니다."}</Notice>
        <RunMeta run={run} />
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <ReportView title={title} report={run.report} />
      {run.trace && run.trace.length > 0 ? <TraceView steps={run.trace} /> : null}
      <RunMeta run={run} />
    </div>
  );
}

function ReportView({ title, report }: { title: string; report: InsightReport }) {
  const unverified = report.verification?.unverified ?? [];
  const actions = [...report.actions].sort((a, b) => a.priority - b.priority);
  return (
    <>
      <Card>
        <p className="text-[12px] text-ink-subtle">
          {title} · {report.period}
        </p>
        <h2 className="mt-1 break-keep text-[20px] font-semibold leading-snug text-ink-primary">{report.headline}</h2>
        {report.verification ? (
          <p className={cn("mt-2 text-[12px]", unverified.length ? "text-brand-primary" : "text-ink-subtle")}>
            {unverified.length
              ? `근거 숫자 ${report.verification.checked}개 중 ${unverified.length}개는 분석 도구 결과에서 확인되지 않았습니다. 아래 표시된 항목은 직접 확인해 주세요.`
              : `근거 숫자 ${report.verification.checked}개가 모두 분석 도구 결과와 일치합니다.`}
          </p>
        ) : null}
      </Card>

      {actions.length > 0 ? (
        <Card title="이번에 해 볼 일">
          <ol className="space-y-3">
            {actions.map((a) => (
              <li key={`${a.priority}-${a.action}`} className="flex gap-3">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-deep text-[12px] font-semibold text-white">
                  {a.priority}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-keep text-[14px] font-medium text-ink-primary">
                    {a.action} <span className="ml-1 text-[12px] font-normal text-ink-subtle">· 노력 {EFFORT_LABELS[a.effort]}</span>
                  </p>
                  <p className="mt-0.5 break-keep text-[13px] text-ink-muted">{a.reason}</p>
                  <p className="mt-0.5 break-keep text-[12px] text-ink-subtle">확인할 지표: {a.expected_effect}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}

      <Card title="발견한 것">
        <div className="space-y-5">
          {report.insights.map((insight) => (
            <section key={insight.title}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-keep text-[15px] font-semibold text-ink-primary">{insight.title}</h3>
                <Chip tone={CONFIDENCE[insight.confidence].tone}>{CONFIDENCE[insight.confidence].label}</Chip>
              </div>
              <p className="mt-1 break-keep text-[14px] leading-relaxed text-ink-body">{insight.finding}</p>
              {insight.evidence.length > 0 ? (
                <dl className="mt-2 grid gap-x-4 gap-y-1 rounded-md bg-black/[0.02] px-3 py-2 text-[13px] sm:grid-cols-[minmax(0,1fr)_auto]">
                  {insight.evidence.map((e) => {
                    const flagged = unverified.some((u) => u.metric === e.metric && u.value === e.value);
                    return (
                      <div key={`${e.metric}-${e.value}`} className="contents">
                        <dt className="text-ink-muted">{e.metric}</dt>
                        <dd className={cn("tabular-nums sm:text-right", flagged ? "text-brand-primary" : "text-ink-primary")}>
                          {e.value}
                          {flagged ? " (확인 필요)" : ""}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              ) : null}
              {insight.sample_note ? <p className="mt-1 text-[12px] text-ink-subtle">{insight.sample_note}</p> : null}
            </section>
          ))}
        </div>
      </Card>

      {report.data_gaps.length > 0 ? (
        <Card title="데이터로 답할 수 없었던 것">
          <ul className="list-disc space-y-1 pl-5 text-[13px] text-ink-muted">
            {report.data_gaps.map((gap) => (
              <li key={gap} className="break-keep">
                {gap}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}

const TOOL_LABELS: Record<string, string> = {
  overview: "전체 성과 요약",
  funnel_by_source: "유입별 구매 단계",
  product_performance: "상품별 성과",
  time_patterns: "요일·시간대",
  customer_behavior: "구매 고객 행동",
  review_signals: "후기",
};

/** 에이전트가 어떤 도구를 어떤 순서로 썼는지. 결과를 믿을 수 있는지 확인하는 데 쓴다. */
function TraceView({ steps }: { steps: InsightTraceStep[] }) {
  return (
    <Card>
      <details>
        <summary className="cursor-pointer text-[14px] font-semibold text-ink-primary">
          분석 과정 <span className="font-normal text-ink-subtle">· 도구 {steps.length}회 사용</span>
        </summary>
        <ol className="mt-3 space-y-2 text-[13px]">
          {steps.map((step, i) => (
            <li key={i} className="flex flex-wrap items-baseline gap-x-2">
              <span className="w-5 text-ink-subtle tabular-nums">{i + 1}</span>
              <span className="font-medium text-ink-primary">{TOOL_LABELS[step.tool] ?? step.tool}</span>
              <code className="text-[12px] text-ink-muted">{JSON.stringify(step.input)}</code>
              {step.ms !== undefined ? <span className="text-[12px] text-ink-subtle">{step.ms}ms</span> : null}
              {step.error ? <span className="text-[12px] text-brand-primary">{step.error}</span> : null}
            </li>
          ))}
        </ol>
      </details>
    </Card>
  );
}

function RunMeta({ run }: { run: InsightRun }) {
  const seconds =
    run.startedAt && run.finishedAt
      ? Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
      : null;
  const parts = [
    run.model,
    run.toolCalls !== undefined ? `도구 ${run.toolCalls}회` : null,
    run.inputTokens !== undefined ? `입력 ${run.inputTokens.toLocaleString("ko-KR")} 토큰` : null,
    run.outputTokens !== undefined ? `출력 ${run.outputTokens.toLocaleString("ko-KR")} 토큰` : null,
    seconds !== null ? `${seconds}초` : null,
    `요청 ${formatDateTime(run.createdAt)}`,
  ].filter(Boolean);
  return <p className="mt-3 text-[12px] text-ink-subtle">{parts.join(" · ")}</p>;
}
