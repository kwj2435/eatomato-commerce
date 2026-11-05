"use client";

import { formatKRW } from "@/lib/utils/format";
import type { Dashboard } from "@/types/admin";

import { BarChart } from "./BarChart";

type Day = Dashboard["dailySales"][number];

/** 최근 14일 일별 매출. 오늘(마지막 날)부터 거꾸로 이틀 간격으로 날짜를 찍어 라벨끼리 붙지 않게 한다. */
export function DailySalesChart({ days }: { days: Day[] }) {
  return (
    <BarChart
      ariaLabel="최근 14일 일별 매출"
      emptyMax={30_000}
      bars={days.map((d, i) => ({
        key: d.date,
        value: d.revenue,
        axisLabel: (days.length - 1 - i) % 2 === 0 ? d.date.slice(5).replace("-", "/") : undefined,
        title: formatKRW(d.revenue),
        sub: `${d.date} · 주문 ${d.orders}건`,
      }))}
      table={{
        headers: ["날짜", "주문", "매출"],
        rows: days.map((d) => [d.date, `${d.orders}건`, formatKRW(d.revenue)]),
      }}
    />
  );
}
