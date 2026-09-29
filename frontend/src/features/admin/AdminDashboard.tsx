"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getDashboard } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { formatKRW } from "@/lib/utils/format";
import type { Dashboard } from "@/types/admin";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/types/order";

import { DailySalesChart } from "./DailySalesChart";
import { formatDateTime } from "./format";
import { Card, Chip, Empty, Notice, PageHeader, tableClass, tdClass, thClass } from "./ui";

/** 결제 현황 대시보드. 매출은 취소 주문을 뺀 결제 금액(배송비 포함)이다. */
export function AdminDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard().then(setData).catch((e: unknown) => setError(errorMessage(e)));
  }, []);

  if (error) return <Notice kind="error">{error}</Notice>;
  if (!data) return <div className="h-[480px] animate-pulse rounded-lg bg-black/[0.04]" />;

  return (
    <>
      <PageHeader title="대시보드" description="결제 현황과 주요 지표. 매출은 결제가 끝난 주문(결제완료·배송중·배송완료)의 결제 금액(배송비 포함)입니다." />

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
        {/* 대시보드의 대표 숫자는 오늘 매출 하나 */}
        <Card>
          <p className="text-[13px] text-ink-subtle">오늘 매출</p>
          <p className="mt-1 text-[48px] font-semibold leading-none tracking-[-1px] text-ink-primary">
            {formatKRW(data.today.revenue)}
          </p>
          <p className="mt-2 text-[13px] text-ink-muted">주문 {data.today.orders}건</p>
        </Card>
        <StatTile label="이번 달 매출" value={formatKRW(data.thisMonth.revenue)} sub={`주문 ${data.thisMonth.orders}건`} />
        <StatTile label="누적 매출" value={formatKRW(data.allTime.revenue)} sub={`주문 ${data.allTime.orders}건`} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="전체 회원" value={`${data.totalMembers.toLocaleString("ko-KR")}명`} sub={`오늘 가입 ${data.newMembersToday}명`} />
        <StatTile
          label="판매 중 상품"
          value={`${data.onSaleProducts}개`}
          sub={`숨김 ${data.hiddenProducts}개 · 품절 ${data.soldOutProducts}개`}
        />
        <StatusTile counts={data.ordersByStatus} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card title="최근 14일 일별 매출">
          <DailySalesChart days={data.dailySales} />
        </Card>
        <Card title="많이 팔린 상품">
          {data.topProducts.length === 0 ? (
            <Empty>아직 판매 내역이 없습니다.</Empty>
          ) : (
            <ol className="space-y-3">
              {data.topProducts.map((p, i) => (
                <li key={p.productId} className="flex items-baseline gap-3 text-[13px]">
                  <span className="w-4 flex-none text-ink-subtle tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-ink-body">{p.name}</span>
                  <span className="flex-none tabular-nums text-ink-muted">{p.quantity}개</span>
                  <span className="w-24 flex-none text-right tabular-nums text-ink-primary">{formatKRW(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card
        title="최근 주문"
        className="mt-4"
        actions={
          <Link href="/admin/orders" className="text-[13px] text-ink-subtle hover:text-ink-body hover:underline">
            전체 보기
          </Link>
        }
      >
        {data.recentOrders.length === 0 ? (
          <Empty>주문이 없습니다.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>주문일시</th>
                  <th className={thClass}>주문번호</th>
                  <th className={thClass}>주문자</th>
                  <th className={thClass}>상품</th>
                  <th className={`${thClass} text-right`}>결제금액</th>
                  <th className={thClass}>상태</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.orderNumber}>
                    <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{formatDateTime(o.orderedAt)}</td>
                    <td className={`${tdClass} tabular-nums`}>{o.orderNumber}</td>
                    <td className={tdClass}>{o.member ? `${o.member.name} (${o.member.loginId})` : "-"}</td>
                    <td className={`${tdClass} max-w-[260px] truncate`}>
                      {o.items[0]?.name}
                      {o.items.length > 1 ? ` 외 ${o.items.length - 1}건` : ""}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`}>{formatKRW(o.total)}</td>
                    <td className={tdClass}>
                      <Chip tone={o.status === "CANCELLED" ? "muted" : "neutral"}>{ORDER_STATUS_LABELS[o.status]}</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <p className="text-[13px] text-ink-subtle">{label}</p>
      <p className="mt-1 text-[24px] font-semibold tracking-[-0.5px] text-ink-primary">{value}</p>
      {sub ? <p className="mt-1 text-[13px] text-ink-muted">{sub}</p> : null}
    </Card>
  );
}

function StatusTile({ counts }: { counts: Record<OrderStatus, number> }) {
  return (
    <Card className="sm:col-span-2">
      <p className="text-[13px] text-ink-subtle">주문 상태</p>
      <dl className="mt-2 grid grid-cols-5 gap-2">
        {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => (
          <Link key={status} href={`/admin/orders?status=${status}`} className="rounded-md px-1 py-1 hover:bg-black/[0.03]">
            <dt className="text-[12px] text-ink-muted">{ORDER_STATUS_LABELS[status]}</dt>
            <dd className="text-[22px] font-semibold text-ink-primary">{counts[status] ?? 0}</dd>
          </Link>
        ))}
      </dl>
    </Card>
  );
}
