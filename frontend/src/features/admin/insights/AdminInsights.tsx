"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { changeSuggestionStatus, getInsightOverview, listInsightRuns, listInsightSuggestions, requestInsightRun } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import type {
  InsightOverview,
  InsightRun,
  InsightSuggestion,
  InsightTraceStep,
  SuggestionCategory,
  SuggestionLevel,
  SuggestionStatus,
} from "@/types/admin";

import { formatDateTime } from "../format";
import { Button, Card, Chip, Empty, Notice, PageHeader } from "../ui";

const POLL_MS = 4000;

const CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  PLANNING: "기획",
  DESIGN: "디자인",
  MARKETING: "마케팅",
  OPERATIONS: "운영",
};

/** 영향·난이도·신뢰도를 운영자가 바로 읽을 수 있는 말로 바꾼다. */
const IMPACT_LABELS: Record<SuggestionLevel, string> = {
  HIGH: "효과 클 것 같아요",
  MEDIUM: "효과 보통",
  LOW: "효과 작을 수 있어요",
};
const EFFORT_LABELS: Record<SuggestionLevel, string> = {
  LOW: "금방 할 수 있어요",
  MEDIUM: "조금 손이 가요",
  HIGH: "시간이 걸려요",
};
const CONFIDENCE_LABELS: Record<SuggestionLevel, string> = {
  HIGH: "근거 충분",
  MEDIUM: "근거 보통",
  LOW: "아직 확실하지 않아요",
};

const VERDICT_LABELS = {
  improved: "효과 있음",
  no_change: "변화 없음",
  worse: "나빠짐",
  insufficient_data: "판단 보류(데이터 부족)",
} as const;

/** 보드 탭. 진행 중은 채택·보류를 함께 본다. */
const TABS: { key: string; label: string; statuses: SuggestionStatus[] }[] = [
  { key: "new", label: "새 제안", statuses: ["NEW"] },
  { key: "doing", label: "진행 중", statuses: ["ADOPTED", "ON_HOLD"] },
  { key: "done", label: "완료", statuses: ["DONE"] },
  { key: "dismissed", label: "제외", statuses: ["DISMISSED"] },
];

/** 상태별로 누를 수 있는 버튼(다음 상태). 첫 버튼이 주 동작이다. */
const ACTIONS: Record<SuggestionStatus, { label: string; next: SuggestionStatus }[]> = {
  NEW: [{ label: "채택", next: "ADOPTED" }, { label: "보류", next: "ON_HOLD" }, { label: "제외", next: "DISMISSED" }],
  ADOPTED: [{ label: "완료", next: "DONE" }, { label: "보류", next: "ON_HOLD" }],
  ON_HOLD: [{ label: "채택", next: "ADOPTED" }, { label: "제외", next: "DISMISSED" }],
  DONE: [{ label: "진행 중으로 되돌리기", next: "ADOPTED" }],
  DISMISSED: [{ label: "새 제안으로 되돌리기", next: "NEW" }],
};

const isActive = (run?: InsightRun) => run?.status === "PENDING" || run?.status === "RUNNING";

/** 대기(워커가 아직 가져가지 않음)와 분석 중을 구분해 보여 준다. */
const activeLabel = (run?: InsightRun) => (run?.status === "PENDING" ? "분석 대기 중" : "분석 중");

/** 근거 한 줄을 가리키는 키(도구 결과에서 확인되지 않은 숫자 표시용). */
const evidenceKey = (metric: string, value: string) => `${metric}\u0000${value}`;

/**
 * 개선 제안: 매일 아침 AI 에이전트(insight-agent)가 방문·주문·후기 데이터를 조회해 기획·디자인·마케팅·운영 제안을 낸다.
 * 관리자는 채택·보류·제외·완료로 관리하고, 완료 7일 뒤 에이전트가 전후 지표로 효과를 확인한다.
 */
export function AdminInsights() {
  const [overview, setOverview] = useState<InsightOverview | null>(null);
  const [suggestions, setSuggestions] = useState<InsightSuggestion[] | null>(null);
  const [tab, setTab] = useState(TABS[0].key);
  const [category, setCategory] = useState<SuggestionCategory | "ALL">("ALL");
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([getInsightOverview(), listInsightSuggestions()])
      .then(([o, s]) => {
        setOverview(o);
        setSuggestions(s);
      })
      .catch((e: unknown) => setError(errorMessage(e)));
  }, []);

  useEffect(load, [load]);

  // 분석이 진행 중이면 끝날 때까지 몇 초마다 다시 읽는다.
  const running = isActive(overview?.active);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [running, load]);

  const runNow = async () => {
    setRequesting(true);
    setError(null);
    try {
      await requestInsightRun();
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setRequesting(false);
    }
  };

  const changeStatus = async (id: number, next: SuggestionStatus) => {
    setError(null);
    try {
      const updated = await changeSuggestionStatus(id, next);
      setSuggestions((prev) => prev?.map((s) => (s.id === id ? updated : s)) ?? prev);
      getInsightOverview().then(setOverview).catch(() => {});
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  // 가장 최근 분석에서 도구 결과로 확인되지 않은 근거. 그 분석이 만든 제안 카드에 표시한다.
  const latestRunId = overview?.latest?.id;
  const unverified = useMemo(
    () =>
      new Set(
        (overview?.latest?.report?.verification?.unverified ?? []).map((u) => evidenceKey(u.metric, u.value)),
      ),
    [overview],
  );

  const current = TABS.find((t) => t.key === tab) ?? TABS[0];
  const visible = useMemo(
    () =>
      (suggestions ?? []).filter(
        (s) => current.statuses.includes(s.status) && (category === "ALL" || s.category === category),
      ),
    [suggestions, current, category],
  );

  return (
    <>
      <PageHeader
        title="개선 제안"
        description="매일 아침 8시에 AI가 방문·주문·후기를 살펴보고 해 볼 만한 일을 알려 드려요. 해 본 일을 '완료'로 바꾸면 7일 뒤 효과가 있었는지 알려 드려요. 고객 개인정보는 AI에 보내지 않아요."
        actions={
          <Button onClick={runNow} disabled={running || requesting}>
            {running ? `${activeLabel(overview?.active)}…` : "지금 분석하기"}
          </Button>
        }
      />
      {error ? (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      ) : null}

      {!overview ? <div className="mb-4 h-32 animate-pulse rounded-lg bg-black/[0.04]" /> : <TodayCard overview={overview} />}

      <div className="mb-3 mt-6 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="제안 상태" className="flex gap-1 rounded-lg bg-black/[0.04] p-1">
          {TABS.map((t) => {
            const count = t.statuses.reduce((sum, s) => sum + (overview?.counts[s] ?? 0), 0);
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px]",
                  tab === t.key ? "bg-white font-semibold text-ink-primary shadow-sm" : "text-ink-muted hover:text-ink-primary",
                )}
              >
                {t.label} <span className="tabular-nums text-ink-subtle">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="분야">
          {(["ALL", "PLANNING", "DESIGN", "MARKETING", "OPERATIONS"] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px]",
                category === c ? "border-brand-deep bg-brand-deep text-white" : "border-black/10 text-ink-muted hover:bg-black/[0.04]",
              )}
            >
              {c === "ALL" ? "전체" : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {!suggestions ? (
        <div className="h-60 animate-pulse rounded-lg bg-black/[0.04]" />
      ) : visible.length === 0 ? (
        <Card>
          <Empty>
            {tab === "new" ? "새 제안이 없습니다. 데이터에서 분명한 신호가 보이면 다음 분석에서 알려 드릴게요." : "해당하는 제안이 없습니다."}
          </Empty>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              unverified={s.runId === latestRunId ? unverified : undefined}
              onChange={(next) => changeStatus(s.id, next)}
            />
          ))}
        </div>
      )}

      <RunHistory reloadKey={overview?.latest?.id ?? 0} />
    </>
  );
}

function TodayCard({ overview }: { overview: InsightOverview }) {
  const { latest, active } = overview;
  const report = latest?.report;
  const unverified = report?.verification?.unverified ?? [];
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-subtle">
        <span>오늘의 요약</span>
        {latest ? (
          <span>
            · {formatDateTime(latest.finishedAt ?? latest.createdAt)} {latest.kind === "DAILY" ? "자동 분석" : "요청 분석"}
          </span>
        ) : null}
        {isActive(active) ? <Chip tone="neutral">{activeLabel(active)}</Chip> : null}
      </div>
      {report ? (
        <>
          <p className="mt-1 break-keep text-[18px] font-semibold leading-snug text-ink-primary">
            {report.summary ?? report.headline}
          </p>
          {report.verification ? (
            <p className={cn("mt-2 text-[12px]", unverified.length ? "text-brand-primary" : "text-ink-subtle")}>
              {unverified.length
                ? `근거 숫자 ${report.verification.checked}개 중 ${unverified.length}개는 실제 데이터에서 찾지 못했어요. AI가 계산했거나 잘못 옮긴 값일 수 있으니 한 번 확인해 주세요.`
                : `근거 숫자 ${report.verification.checked}개를 실제 데이터와 맞춰 봤고 모두 맞아요.`}
            </p>
          ) : null}
          {(report.data_gaps?.length ?? 0) > 0 || (latest?.trace?.length ?? 0) > 0 ? (
            <details className="mt-3 text-[13px]">
              <summary className="cursor-pointer text-ink-muted">AI가 알 수 없었던 것 · 분석 과정</summary>
              {report.data_gaps?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-muted">
                  {report.data_gaps.map((gap) => (
                    <li key={gap} className="break-keep">
                      {gap}
                    </li>
                  ))}
                </ul>
              ) : null}
              {latest?.trace?.length ? <TraceList steps={latest.trace} /> : null}
            </details>
          ) : null}
        </>
      ) : (
        <p className="mt-1 text-[14px] text-ink-muted">
          아직 완료된 분석이 없습니다. 매일 오전 8시에 자동으로 분석하며, 지금 바로 보려면 &lsquo;지금 분석하기&rsquo;를 눌러 주세요.
        </p>
      )}
    </Card>
  );
}

function SuggestionCard({
  suggestion: s,
  unverified,
  onChange,
}: {
  suggestion: InsightSuggestion;
  /** 이 제안을 만든 분석에서 도구 결과로 확인되지 않은 근거(가장 최근 분석의 제안만 알 수 있다). */
  unverified?: Set<string>;
  onChange: (next: SuggestionStatus) => void;
}) {
  const actions = ACTIONS[s.status];
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={s.status === "NEW" ? "brand" : "neutral"}>{CATEGORY_LABELS[s.category]}</Chip>
            <span className="text-[12px] text-ink-subtle">{formatDateTime(s.createdAt)}</span>
          </div>
          <h3 className="mt-1.5 break-keep text-[17px] font-semibold leading-snug text-ink-primary">{s.title}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="한눈에 보기">
            <Chip tone="muted">{IMPACT_LABELS[s.impact]}</Chip>
            <Chip tone="muted">{EFFORT_LABELS[s.effort]}</Chip>
            <Chip tone="muted">{CONFIDENCE_LABELS[s.confidence]}</Chip>
          </div>
        </div>
        <div className="flex flex-none gap-1.5">
          {actions.map((a, i) => (
            <Button key={a.next} size="sm" variant={i === 0 ? "primary" : "secondary"} onClick={() => onChange(a.next)}>
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3 text-[14px] leading-relaxed">
        <Section label="무엇을 봤나요">
          <p className="break-keep text-ink-body">{s.problem}</p>
        </Section>
        <Section label="이렇게 해 보세요">
          <Steps text={s.proposal} />
        </Section>
        <Section label="잘됐는지 확인하는 법">
          <p className="break-keep text-ink-muted">{s.metric}</p>
        </Section>
      </div>

      {s.evidence.length > 0 ? (
        <EvidenceList evidence={s.evidence} flagged={(e) => unverified?.has(evidenceKey(e.metric, e.value)) ?? false} />
      ) : null}

      {s.reconfirmCount > 0 ? (
        <p className="mt-2 break-keep text-[12px] text-ink-muted">
          다른 날에도 {s.reconfirmCount}번 같은 문제가 보였어요{s.reconfirmNote ? ` · ${s.reconfirmNote}` : ""}
        </p>
      ) : null}

      {s.status === "DONE" ? (
        s.followUp ? (
          <div className="mt-3 rounded-md border border-black/10 px-3 py-2 text-[13px]">
            <p className="font-medium text-ink-primary">효과 확인: {VERDICT_LABELS[s.followUp.verdict]}</p>
            <p className="mt-0.5 break-keep text-ink-muted">{s.followUp.summary}</p>
          </div>
        ) : (
          <p className="mt-3 text-[12px] text-ink-subtle">
            {s.doneAt ? `${formatDateTime(s.doneAt)} 완료 · ` : ""}7일 뒤 아침에 효과가 있었는지 알려 드려요.
          </p>
        )
      ) : null}
    </Card>
  );
}

/** 카드 안 한 단락: 위에 작은 제목, 아래에 내용. */
function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <h4 className="text-[12px] font-semibold text-ink-subtle">{label}</h4>
      <div className="mt-0.5">{children}</div>
    </section>
  );
}

/**
 * 제안 본문. 에이전트가 단계마다 줄을 바꿔 "1. …" 로 쓰면 번호 목록으로, 예전처럼 한 덩어리면 문단으로 보여 준다.
 */
function Steps({ text }: { text: string }) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return <p className="break-keep text-ink-body">{text}</p>;
  return (
    <ol className="space-y-1">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2 break-keep text-ink-body">
          <span className="w-4 flex-none text-right font-semibold tabular-nums text-brand-deep">{i + 1}</span>
          <span className="min-w-0">{line.replace(/^\s*\d+[.)]\s*/, "")}</span>
        </li>
      ))}
    </ol>
  );
}

/** 근거 숫자. 평소엔 접어 두고, 실제 데이터에서 찾지 못한 숫자가 있으면 펼쳐서 보여 준다. */
function EvidenceList({
  evidence,
  flagged,
}: {
  evidence: InsightSuggestion["evidence"];
  flagged: (e: InsightSuggestion["evidence"][number]) => boolean;
}) {
  const flaggedCount = evidence.filter(flagged).length;
  return (
    <details className="mt-3 text-[13px]" open={flaggedCount > 0}>
      <summary className="cursor-pointer text-ink-muted">
        근거 숫자 {evidence.length}개 보기
        {flaggedCount > 0 ? <span className="text-brand-primary"> · 확인 필요 {flaggedCount}개</span> : null}
      </summary>
      <dl className="mt-2 grid gap-x-4 gap-y-1 rounded-md bg-black/[0.02] px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        {evidence.map((e) => {
          const bad = flagged(e);
          return (
            <div key={`${e.metric}-${e.value}`} className="contents">
              <dt className="break-keep text-ink-muted">{e.metric}</dt>
              <dd className={cn("tabular-nums sm:text-right", bad ? "text-brand-primary" : "text-ink-primary")}>
                {e.value}
                {bad ? " (확인 필요)" : ""}
              </dd>
            </div>
          );
        })}
      </dl>
    </details>
  );
}

const TOOL_LABELS: Record<string, string> = {
  overview: "전체 성과 요약",
  funnel_by_source: "유입별 구매 단계",
  product_performance: "상품별 성과",
  time_patterns: "요일·시간대",
  customer_behavior: "구매 고객 행동",
  review_signals: "후기",
  page_flow: "화면 흐름",
  compare_before_after: "전후 비교",
};

function TraceList({ steps }: { steps: InsightTraceStep[] }) {
  return (
    <ol className="mt-3 space-y-1.5">
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
  );
}

const RUN_STATUS_LABELS = { PENDING: "대기", RUNNING: "분석 중", DONE: "완료", FAILED: "실패" } as const;

/** 분석 실행 기록. 실패 사유와 사용량을 확인할 때 연다. */
function RunHistory({ reloadKey }: { reloadKey: number }) {
  const [runs, setRuns] = useState<InsightRun[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    listInsightRuns().then(setRuns).catch(() => {});
  }, [open, reloadKey]);

  return (
    <Card className="mt-6">
      <details onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer text-[14px] font-semibold text-ink-primary">분석 기록</summary>
        {!runs ? (
          <div className="mt-3 h-20 animate-pulse rounded-md bg-black/[0.04]" />
        ) : runs.length === 0 ? (
          <p className="mt-3 text-[13px] text-ink-subtle">아직 기록이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/5 text-[13px]">
            {runs.map((run) => (
              <li key={run.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
                <span className="tabular-nums text-ink-muted">{formatDateTime(run.createdAt)}</span>
                <span className="text-ink-primary">{run.kind === "DAILY" ? "자동" : run.question ? "질문" : "요청"}</span>
                <span className={run.status === "FAILED" ? "text-brand-primary" : "text-ink-muted"}>
                  {RUN_STATUS_LABELS[run.status]}
                </span>
                {run.toolCalls !== undefined ? (
                  <span className="text-[12px] text-ink-subtle">
                    도구 {run.toolCalls}회 · 토큰 {((run.inputTokens ?? 0) + (run.outputTokens ?? 0)).toLocaleString("ko-KR")}
                  </span>
                ) : null}
                {run.error ? <span className="w-full break-keep text-[12px] text-brand-primary">{run.error}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </details>
    </Card>
  );
}
