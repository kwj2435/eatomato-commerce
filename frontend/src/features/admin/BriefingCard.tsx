"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { getBriefing } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { formatKRW } from "@/lib/utils/format";
import type { Briefing, BriefingDay, BriefingItem, BriefingLevel } from "@/types/admin";

import { Button, Card, Chip, Notice } from "./ui";

const LEVEL_LABELS: Record<BriefingLevel, string> = { URGENT: "긴급", WARNING: "확인", INFO: "참고" };

/** 긴급만 브랜드 색으로 눈에 띄게 한다(관리자 화면은 강조색을 하나만 쓴다). */
const LEVEL_TONE: Record<BriefingLevel, "brand" | "neutral" | "muted"> = {
  URGENT: "brand",
  WARNING: "neutral",
  INFO: "muted",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 2026-11-08 → 11월 8일(일). 날짜만 있는 값이라 시간대 영향을 받지 않게 직접 나눈다. */
function formatDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}월 ${d}일(${weekday})`;
}

/** 지난주 같은 요일 대비. 지난주가 0 이면 비율 대신 지난주 값을 그대로 보여준다. */
function compare(now: number, before: number, format: (v: number) => string): string {
  if (before === 0) return now === 0 ? "지난주와 같음" : `지난주 ${format(0)}`;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return "지난주와 비슷";
  return `지난주보다 ${pct > 0 ? "+" : ""}${pct}%`;
}

/**
 * 오늘의 브리핑: 지금 처리할 주문·재고·후기와 어제 실적. 숫자와 우선순위는 서버(BriefingRules)가 정한다.
 * 대시보드와 따로 불러, 브리핑이 실패해도 나머지 대시보드는 보인다.
 */
export function BriefingCard({ className }: { className?: string }) {
  const [data, setData] = useState<Briefing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    getBriefing()
      .then((b) => {
        setData(b);
        setError(null);
      })
      .catch((e: unknown) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const refresh = () => {
    setLoading(true);
    load();
  };

  const time = data
    ? new Date(data.generatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
    : null;

  return (
    <Card
      title="오늘의 브리핑"
      className={className}
      actions={
        <div className="flex items-center gap-2 text-[12px] text-ink-subtle">
          {time ? <span>{time} 기준</span> : null}
          <Button size="sm" variant="ghost" onClick={refresh} disabled={loading}>
            새로고침
          </Button>
        </div>
      }
    >
      {error ? <Notice kind="error">브리핑을 불러오지 못했습니다. {error}</Notice> : null}
      {!data ? (
        error ? null : <div className="h-28 animate-pulse rounded-md bg-black/[0.04]" />
      ) : (
        <>
          <YesterdaySummary day={data.yesterday} lastWeek={data.sameDayLastWeek} />
          {data.items.length === 0 ? (
            <p className="mt-4 rounded-md bg-black/[0.02] px-4 py-6 text-center text-[13px] text-ink-muted">
              지금 처리할 일이 없어요.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-black/5 border-t border-black/5">
              {data.items.map((item, i) => (
                <BriefingRow key={`${item.kind}-${i}`} item={item} />
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}

function YesterdaySummary({ day, lastWeek }: { day: BriefingDay; lastWeek: BriefingDay }) {
  const count = (v: number) => `${v.toLocaleString("ko-KR")}`;
  const stats = [
    { label: "주문", value: `${count(day.orders)}건`, sub: compare(day.orders, lastWeek.orders, (v) => `${v}건`) },
    { label: "매출", value: formatKRW(day.revenue), sub: compare(day.revenue, lastWeek.revenue, formatKRW) },
    { label: "방문자", value: `${count(day.visitors)}명`, sub: compare(day.visitors, lastWeek.visitors, (v) => `${v}명`) },
  ];
  return (
    <div>
      <p className="text-[12px] text-ink-subtle">어제 {formatDay(day.date)} · 지난주 같은 요일과 비교</p>
      <dl className="mt-2 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <dt className="text-[12px] text-ink-muted">{s.label}</dt>
            <dd className="break-all text-[16px] font-semibold tabular-nums text-ink-primary md:text-[18px]">{s.value}</dd>
            <dd className="text-[12px] text-ink-subtle">{s.sub}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function BriefingRow({ item }: { item: BriefingItem }) {
  const isAdmin = item.link?.startsWith("/admin");
  const linkClass = "flex-none whitespace-nowrap text-[12px] text-ink-muted hover:text-ink-primary hover:underline";
  return (
    <li className="flex items-start gap-3 py-3">
      <span className="flex-none pt-px">
        <Chip tone={LEVEL_TONE[item.level]}>{LEVEL_LABELS[item.level]}</Chip>
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-keep text-[14px] font-medium text-ink-primary">{item.title}</p>
        {item.detail ? <p className="mt-0.5 break-keep text-[12px] text-ink-muted">{item.detail}</p> : null}
      </div>
      {item.link ? (
        isAdmin ? (
          <Link href={item.link} className={linkClass}>
            바로가기 ›
          </Link>
        ) : (
          // 스토어 화면(후기가 달린 상품 등)은 관리자 화면을 두고 새 탭으로 연다.
          <a href={item.link} target="_blank" rel="noopener noreferrer" className={linkClass}>
            상품 보기 ↗
          </a>
        )
      ) : null}
    </li>
  );
}
