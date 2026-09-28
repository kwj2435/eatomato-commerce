"use client";

import { useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";

import { changeAdminOrderStatus, listAdminOrders } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { formatKRW } from "@/lib/utils/format";
import type { AdminOrder, Page } from "@/types/admin";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/types/order";

import { formatDateTime } from "../format";
import { Button, Card, Empty, Notice, PageHeader, Pagination, inputClass, tableClass, tdClass, thClass } from "../ui";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

function isStatus(value: string | null): value is OrderStatus {
  return value !== null && (STATUSES as string[]).includes(value);
}

/**
 * 주문·결제 현황. 결제(PG) 연동 전이라 주문은 생성 즉시 "결제완료" 이고,
 * 배송 진행에 맞춰 관리자가 상태를 바꾼다. 대시보드의 상태 타일에서 `?status=` 로 들어올 수 있다.
 */
export function AdminOrderList() {
  const initialStatus = useSearchParams().get("status");
  const [status, setStatus] = useState<OrderStatus | "">(isStatus(initialStatus) ? initialStatus : "");
  const [q, setQ] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<AdminOrder> | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    listAdminOrders({ status, q: keyword, page })
      .then(setData)
      .catch((e: unknown) => setError(errorMessage(e)));
  }, [status, keyword, page]);

  useEffect(load, [load]);

  const change = async (order: AdminOrder, next: OrderStatus) => {
    if (next === "CANCELLED" && !window.confirm(`주문 ${order.orderNumber} 을(를) 취소 처리할까요?`)) return;
    try {
      const updated = await changeAdminOrderStatus(order.orderNumber, next);
      setData((prev) =>
        prev ? { ...prev, content: prev.content.map((o) => (o.orderNumber === updated.orderNumber ? updated : o)) } : prev,
      );
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader title="주문·결제" description="결제 연동 전이라 주문은 생성 즉시 결제완료로 기록됩니다. 취소 주문은 매출에서 빠집니다." />
      <Card>
        <form
          className="mb-4 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            setKeyword(q.trim());
          }}
        >
          <select
            aria-label="주문 상태"
            value={status}
            onChange={(e) => {
              setPage(0);
              setStatus(e.target.value as OrderStatus | "");
            }}
            className={`${inputClass} w-36`}
          >
            <option value="">전체 상태</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <input
            aria-label="주문 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="주문번호 또는 주문자 아이디"
            className={`${inputClass} w-64`}
          />
          <Button type="submit">검색</Button>
        </form>

        {error ? <Notice kind="error">{error}</Notice> : null}

        {!data ? (
          <div className="h-60 animate-pulse rounded-md bg-black/[0.04]" />
        ) : data.content.length === 0 ? (
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
                {data.content.map((o) => (
                  <Fragment key={o.orderNumber}>
                    <tr>
                      <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{formatDateTime(o.orderedAt)}</td>
                      <td className={tdClass}>
                        <button
                          type="button"
                          onClick={() => setExpanded((v) => (v === o.orderNumber ? null : o.orderNumber))}
                          aria-expanded={expanded === o.orderNumber}
                          className="tabular-nums hover:underline"
                        >
                          {o.orderNumber}
                        </button>
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        {o.member ? `${o.member.name} (${o.member.loginId})` : "-"}
                      </td>
                      <td className={`${tdClass} max-w-[240px] truncate`}>
                        {o.items[0]?.name}
                        {o.items.length > 1 ? ` 외 ${o.items.length - 1}건` : ""}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap text-right tabular-nums`}>{formatKRW(o.total)}</td>
                      <td className={tdClass}>
                        <select
                          aria-label={`주문 ${o.orderNumber} 상태`}
                          value={o.status}
                          onChange={(e) => change(o, e.target.value as OrderStatus)}
                          className="h-8 rounded-md border border-black/15 bg-white px-2 text-[13px]"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {ORDER_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {expanded === o.orderNumber ? (
                      <tr>
                        <td colSpan={6} className="border-b border-black/5 bg-black/[0.02] px-6 py-3">
                          <ul className="space-y-1 text-[13px]">
                            {o.items.map((item) => (
                              <li key={item.id} className="flex justify-between gap-4">
                                <span>
                                  {item.name}
                                  {item.option ? <span className="text-ink-subtle"> · {item.option}</span> : null}
                                </span>
                                <span className="whitespace-nowrap tabular-nums text-ink-muted">
                                  {formatKRW(item.unitPrice)} × {item.quantity}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-right text-[12px] text-ink-subtle">
                            상품 {formatKRW(o.subtotal)} + 배송비 {formatKRW(o.shippingFee)} = {formatKRW(o.total)}
                          </p>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data ? <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} /> : null}
      </Card>
    </>
  );
}
