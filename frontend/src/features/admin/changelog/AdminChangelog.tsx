"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils/cn";

import { Card, Chip, Empty, PageHeader } from "../ui";
import { CHANGELOG, type ChangeArea, type ChangeType } from "./changelog";

const TYPE_LABELS: Record<ChangeType, string> = { new: "추가", improve: "개선", fix: "수정" };
const TYPE_TONE: Record<ChangeType, "brand" | "neutral" | "muted"> = { new: "brand", improve: "neutral", fix: "muted" };
const AREAS: ChangeArea[] = ["스토어", "관리자", "주문·결제", "회원", "운영"];
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")} (${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]})`;
}

/** 관리자 > 업데이트 이력. 기능을 추가·개선·수정한 기록(changelog.ts)을 날짜별로 보여 준다. */
export function AdminChangelog() {
  const [area, setArea] = useState<ChangeArea | "전체">("전체");
  const [type, setType] = useState<ChangeType | "all">("all");

  const days = useMemo(
    () =>
      CHANGELOG.map((day) => ({
        ...day,
        items: day.items.filter((i) => (area === "전체" || i.area === area) && (type === "all" || i.type === type)),
      })).filter((day) => day.items.length > 0),
    [area, type],
  );

  const pill = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-[12px]",
      active ? "border-brand-deep bg-brand-deep text-white" : "border-black/10 text-ink-muted hover:bg-black/[0.04]",
    );

  return (
    <>
      <PageHeader title="업데이트 이력" description="스토어와 관리자에 기능을 추가·개선·수정한 기록입니다. 최신 순으로 보여 줍니다." />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-1.5" aria-label="영역">
          {(["전체", ...AREAS] as const).map((a) => (
            <button key={a} type="button" aria-pressed={area === a} onClick={() => setArea(a)} className={pill(area === a)}>
              {a}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="종류">
          {(["all", "new", "improve", "fix"] as const).map((t) => (
            <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className={pill(type === t)}>
              {t === "all" ? "모든 종류" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {days.length === 0 ? (
        <Card>
          <Empty>해당하는 이력이 없습니다.</Empty>
        </Card>
      ) : (
        <Card>
          <ol className="divide-y divide-black/5">
            {days.map((day) => (
              <li key={day.date} className="grid gap-2 py-4 first:pt-0 last:pb-0 md:grid-cols-[150px_minmax(0,1fr)]">
                <time dateTime={day.date} className="text-[13px] font-semibold tabular-nums text-ink-primary">
                  {formatDay(day.date)}
                </time>
                <ul className="space-y-2.5">
                  {day.items.map((item) => (
                    <li key={item.title} className="flex gap-2.5">
                      <span className="flex-none pt-px">
                        <Chip tone={TYPE_TONE[item.type]}>{TYPE_LABELS[item.type]}</Chip>
                      </span>
                      <div className="min-w-0">
                        <p className="break-keep text-[14px] text-ink-primary">
                          {item.title} <span className="ml-1 text-[12px] text-ink-subtle">{item.area}</span>
                        </p>
                        {item.detail ? <p className="mt-0.5 break-keep text-[13px] text-ink-muted">{item.detail}</p> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </>
  );
}
