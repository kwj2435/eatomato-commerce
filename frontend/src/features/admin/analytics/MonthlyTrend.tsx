"use client";

import { useEffect, useMemo, useState } from "react";

import { getAnalyticsMonthly } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import type { AnalyticsMonth } from "@/types/admin";

import { BarChart } from "../BarChart";
import { Card, Empty, Notice, tableClass, tdClass, thClass } from "../ui";

type View = "month" | "year";
type Metric = "sessions" | "purchases" | "revenue";

/** 월별·연도별 모두 더할 수 있는 값만 막대로 고른다(방문자는 달을 더하면 같은 사람이 겹쳐 세진다). */
const METRICS: { key: Metric; label: string; unit: string }[] = [
  { key: "sessions", label: "방문", unit: "회" },
  { key: "purchases", label: "결제 완료", unit: "건" },
  { key: "revenue", label: "매출", unit: "원" },
];

/** 표·막대 한 줄(한 달 또는 한 해). 연도별의 visitors 는 그해 달별 방문자의 평균이다. */
type Row = {
  key: string;
  label: string;
  /** 표에 붙이는 짧은 설명(진행 중·일부 기간). */
  note?: string;
  visitors: number;
  sessions: number;
  pageViews: number;
  purchaseSessions: number;
  purchases: number;
  revenue: number;
  /** 작년 같은 기간 방문 대비 변화율(%). 견줄 기록이 없으면 null. */
  sessionsYoY: number | null;
};

/**
 * 월별·연도별 추세. 끝난 달은 서버가 합계로 남겨 두므로 원본 기록(13개월)이 지워진 뒤에도 볼 수 있다.
 * 위쪽 기간 버튼(오늘~90일)과 따로 움직인다.
 */
export function MonthlyTrend() {
  const [months, setMonths] = useState<AnalyticsMonth[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("month");
  const [metric, setMetric] = useState<Metric>("sessions");

  useEffect(() => {
    let cancelled = false;
    getAnalyticsMonthly()
      .then((result) => {
        if (!cancelled) setMonths(result);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => (months ? (view === "month" ? monthRows(months) : yearRows(months)) : []), [months, view]);
  const current = METRICS.find((m) => m.key === metric) ?? METRICS[0];

  return (
    <Card
      title="월별·연도별 추세"
      className="mt-4"
      actions={
        <div className="flex flex-wrap justify-end gap-2">
          <Segmented
            label="묶음"
            options={[
              { key: "month", label: "월별" },
              { key: "year", label: "연도별" },
            ]}
            value={view}
            onChange={(v) => setView(v as View)}
          />
          <Segmented
            label="막대 지표"
            options={METRICS.map((m) => ({ key: m.key, label: m.label }))}
            value={metric}
            onChange={(v) => setMetric(v as Metric)}
          />
        </div>
      }
    >
      {error ? <Notice kind="error">{error}</Notice> : null}
      {!months && !error ? <div className="h-[260px] animate-pulse rounded-md bg-black/[0.04]" /> : null}
      {months && rows.length === 0 ? <Empty>아직 쌓인 방문 기록이 없습니다.</Empty> : null}
      {rows.length > 0 ? (
        <>
          <BarChart
            ariaLabel={`${view === "month" ? "월별" : "연도별"} ${current.label}`}
            bars={rows.map((r, i) => ({
              key: r.key,
              value: r[metric],
              axisLabel: (rows.length - 1 - i) % axisStep(rows.length) === 0 ? r.label : undefined,
              title: `${current.label} ${fmt(r[metric])}${current.unit}`,
              sub: r.note ? `${r.label} (${r.note})` : r.label,
            }))}
            table={{
              headers: [view === "month" ? "월" : "연도", current.label],
              rows: rows.map((r) => [r.label, `${fmt(r[metric])}${current.unit}`]),
            }}
          />

          <div className="mt-4 overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>{view === "month" ? "월" : "연도"}</th>
                  <th className={`${thClass} text-right`} title={view === "year" ? "그해 달별 방문자의 평균" : undefined}>
                    {view === "month" ? "방문자" : "월 평균 방문자"}
                  </th>
                  <th className={`${thClass} text-right`}>방문</th>
                  <th className={`${thClass} text-right`}>작년 대비</th>
                  <th className={`${thClass} text-right`}>조회</th>
                  <th className={`${thClass} text-right`}>결제 완료</th>
                  <th className={`${thClass} text-right`}>매출</th>
                  <th className={`${thClass} text-right`} title="결제를 마친 방문 ÷ 전체 방문">
                    구매 전환율
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((r) => (
                  <tr key={r.key}>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <span className="text-ink-body">{r.label}</span>
                      {r.note ? <span className="ml-1.5 text-[12px] text-ink-subtle">{r.note}</span> : null}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`}>{fmt(r.visitors)}명</td>
                    <td className={`${tdClass} text-right tabular-nums`}>{fmt(r.sessions)}회</td>
                    <td
                      className={cn(
                        `${tdClass} text-right tabular-nums`,
                        r.sessionsYoY === null ? "text-ink-subtle" : "text-ink-body",
                      )}
                    >
                      {r.sessionsYoY === null ? "-" : `${r.sessionsYoY >= 0 ? "▲" : "▼"} ${Math.abs(r.sessionsYoY).toFixed(0)}%`}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`}>{fmt(r.pageViews)}회</td>
                    <td className={`${tdClass} text-right tabular-nums`}>{fmt(r.purchases)}건</td>
                    <td className={`${tdClass} text-right tabular-nums text-ink-primary`}>{fmt(r.revenue)}원</td>
                    <td className={`${tdClass} text-right tabular-nums`}>
                      {r.sessions > 0 ? `${((r.purchaseSessions / r.sessions) * 100).toFixed(1)}%` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-subtle">
            작년 대비는 방문 수를 작년 같은 {view === "month" ? "달" : "기간(같은 달들)"}과 견준 값입니다. 연도별에서 방문자는
            달마다 같은 사람이 겹쳐 세지므로 더하지 않고 월 평균으로 보여 줍니다. 방문 하나하나의 기록은 13개월 동안 보관하고,
            그 뒤에는 이 월별 합계만 남습니다.
          </p>
        </>
      ) : null}
    </Card>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-md border border-black/15 bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "h-7 rounded px-2.5 text-[12px] transition-colors",
            value === o.key ? "bg-brand-deep font-medium text-white" : "text-ink-muted hover:bg-black/[0.04]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** 이번 달인지(서버는 마지막 항목으로 진행 중인 이번 달을 준다). */
const isLast = (list: AnalyticsMonth[], m: AnalyticsMonth) => list[list.length - 1] === m;

/** "16일부터" 처럼 한 달 전체가 아닌 달의 설명. */
function monthNote(list: AnalyticsMonth[], m: AnalyticsMonth): string | undefined {
  const partial = m.dataFrom !== m.monthStart ? `${Number(m.dataFrom.slice(8))}일부터` : null;
  const notes = [isLast(list, m) ? "진행 중" : null, partial].filter(Boolean);
  return notes.length ? notes.join(" · ") : undefined;
}

const change = (now: number, before: number | undefined) =>
  before === undefined || before === 0 ? null : ((now - before) / before) * 100;

function monthRows(list: AnalyticsMonth[]): Row[] {
  const byMonth = new Map(list.map((m) => [m.monthStart.slice(0, 7), m]));
  return list.map((m) => {
    const ym = m.monthStart.slice(0, 7);
    const lastYear = byMonth.get(`${Number(ym.slice(0, 4)) - 1}${ym.slice(4)}`);
    // 일부 기간만 있는 달끼리 견주면 틀어지므로 둘 다 한 달 전체일 때만 견준다.
    const comparable = lastYear && lastYear.dataFrom === lastYear.monthStart && m.dataFrom === m.monthStart && !isLast(list, m);
    return {
      key: ym,
      label: `${ym.slice(0, 4)}.${ym.slice(5)}`,
      note: monthNote(list, m),
      visitors: m.visitors,
      sessions: m.sessions,
      pageViews: m.pageViews,
      purchaseSessions: m.purchaseSessions,
      purchases: m.purchases,
      revenue: m.revenue,
      sessionsYoY: comparable ? change(m.sessions, lastYear.sessions) : null,
    };
  });
}

function yearRows(list: AnalyticsMonth[]): Row[] {
  const years = new Map<string, AnalyticsMonth[]>();
  for (const m of list) {
    const y = m.monthStart.slice(0, 4);
    years.set(y, [...(years.get(y) ?? []), m]);
  }
  const sum = (ms: AnalyticsMonth[], k: keyof AnalyticsMonth) => ms.reduce((acc, m) => acc + (m[k] as number), 0);
  const fullMonths = (ms: AnalyticsMonth[]) => {
    const full = ms.filter((m) => m.dataFrom === m.monthStart && !isLast(list, m));
    return full.length > 0 ? full : ms;
  };

  return [...years.entries()].map(([year, ms]) => {
    const first = Number(ms[0].monthStart.slice(5, 7));
    const last = Number(ms[ms.length - 1].monthStart.slice(5, 7));
    const whole = ms.length === 12 && ms.every((m) => m.dataFrom === m.monthStart) && !ms.some((m) => isLast(list, m));
    // 작년 대비: 올해 있는 달과 같은 달만 작년에서 골라 더한다(둘 다 한 달 전체인 달만).
    const prev = years.get(String(Number(year) - 1)) ?? [];
    const pairs = ms
      .filter((m) => m.dataFrom === m.monthStart && !isLast(list, m))
      .map((m) => [m, prev.find((p) => p.monthStart.slice(5) === m.monthStart.slice(5) && p.dataFrom === p.monthStart)] as const)
      .filter((pair): pair is readonly [AnalyticsMonth, AnalyticsMonth] => pair[1] !== undefined);
    const yoy = pairs.length
      ? change(
          pairs.reduce((acc, [m]) => acc + m.sessions, 0),
          pairs.reduce((acc, [, p]) => acc + p.sessions, 0),
        )
      : null;
    return {
      key: year,
      label: `${year}년`,
      note: whole ? undefined : `${first}~${last}월${ms.some((m) => isLast(list, m)) ? " · 진행 중" : ""}`,
      // 일부 기간만 있는 달(기록 시작 달·진행 중인 달)은 평균을 끌어내리므로, 한 달 전체가 있는 달이 있으면 그 달들로만 낸다.
      visitors: Math.round(sum(fullMonths(ms), "visitors") / fullMonths(ms).length),
      sessions: sum(ms, "sessions"),
      pageViews: sum(ms, "pageViews"),
      purchaseSessions: sum(ms, "purchaseSessions"),
      purchases: sum(ms, "purchases"),
      revenue: sum(ms, "revenue"),
      sessionsYoY: yoy,
    };
  });
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

/** 막대 수에 맞춰 축 라벨 간격을 벌린다. */
const axisStep = (count: number) => (count <= 12 ? 1 : count <= 24 ? 3 : 6);
