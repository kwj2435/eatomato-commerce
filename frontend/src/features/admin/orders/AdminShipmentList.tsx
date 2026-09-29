"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { changeAdminOrderStatus, listAllAdminOrders } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { formatKRW, formatPhone } from "@/lib/utils/format";
import type { AdminOrder } from "@/types/admin";

import { formatDateTime } from "../format";
import { Button, Card, Empty, Notice, PageHeader } from "../ui";
import { downloadCsv, optionText, shipmentCsv, totalQuantity } from "./shipment-csv";

/** 파일 이름용 날짜(20260929). */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * 배송 준비: 결제완료(아직 보내지 않은) 주문을 오래된 순으로 모두 펼쳐 보여준다.
 * 받는 분·주소·상품 수량을 한 화면에서 보고, CSV 로 내려받아 택배 접수에 쓴다.
 * 발송한 주문은 "배송중으로 변경" 을 누르면 목록에서 빠진다.
 */
export function AdminShipmentList() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    listAllAdminOrders("PAID")
      .then((list) => {
        // 먼저 결제한 주문부터 보낸다.
        const sorted = [...list].sort((a, b) => (a.paidAt ?? a.orderedAt).localeCompare(b.paidAt ?? b.orderedAt));
        setOrders(sorted);
        setSelected((prev) => new Set([...prev].filter((n) => sorted.some((o) => o.orderNumber === n))));
      })
      .catch((e: unknown) => setError(errorMessage(e)));
  }, []);

  useEffect(load, [load]);

  /** 포장할 때 쓰는 상품·옵션별 합계. 선택한 주문이 있으면 그 주문만 센다. */
  const picking = useMemo(() => {
    const source = (orders ?? []).filter((o) => selected.size === 0 || selected.has(o.orderNumber));
    const map = new Map<string, { name: string; option?: string; quantity: number }>();
    for (const order of source) {
      for (const item of order.items) {
        const option = optionText(item.option);
        const key = `${item.productId}|${option ?? ""}`;
        const row = map.get(key) ?? { name: item.name, option, quantity: 0 };
        row.quantity += item.quantity;
        map.set(key, row);
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ko") || (a.option ?? "").localeCompare(b.option ?? "", "ko"));
  }, [orders, selected]);

  if (!orders) {
    return (
      <>
        <PageHeader title="배송 준비" />
        {error ? <Notice kind="error">{error}</Notice> : <div className="h-60 animate-pulse rounded-lg bg-black/[0.04]" />}
      </>
    );
  }

  const allSelected = orders.length > 0 && selected.size === orders.length;
  const targets = selected.size > 0 ? orders.filter((o) => selected.has(o.orderNumber)) : orders;

  const toggle = (orderNumber: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(orderNumber)) next.delete(orderNumber);
      else next.add(orderNumber);
      return next;
    });

  const download = () => {
    downloadCsv(`eatomato-배송-${today()}.csv`, shipmentCsv(targets));
  };

  const ship = async (order: AdminOrder) => {
    if (!window.confirm(`주문 ${order.orderNumber} 을(를) 발송했나요?\n'배송중'으로 바꾸면 이 목록에서 빠집니다.`)) return;
    setError(null);
    try {
      await changeAdminOrderStatus(order.orderNumber, "SHIPPING");
      setOrders((prev) => prev?.filter((o) => o.orderNumber !== order.orderNumber) ?? prev);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(order.orderNumber);
        return next;
      });
      setMessage(`주문 ${order.orderNumber} 을(를) 배송중으로 바꿨습니다.`);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader
        title="배송 준비"
        description="결제완료 주문(아직 보내지 않은 주문)을 먼저 결제한 순서로 보여줍니다. 발송한 뒤 '배송중으로 변경'을 누르면 목록에서 빠집니다."
        actions={
          <>
            <Button onClick={load}>새로고침</Button>
            <Button variant="primary" disabled={orders.length === 0} onClick={download}>
              {selected.size > 0 ? `선택한 ${selected.size}건 엑셀(CSV) 다운로드` : `전체 ${orders.length}건 엑셀(CSV) 다운로드`}
            </Button>
          </>
        }
      />

      <div className="mb-4 space-y-2">
        {error ? <Notice kind="error">{error}</Notice> : null}
        {message ? <Notice kind="success">{message}</Notice> : null}
      </div>

      {orders.length === 0 ? (
        <Card>
          <Empty>
            보낼 주문이 없습니다. 지난 주문은{" "}
            <Link href="/admin/orders" className="underline">
              주문·결제
            </Link>
            에서 볼 수 있습니다.
          </Empty>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-3">
            <label className="flex items-center gap-2 px-1 text-[13px] text-ink-muted">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.orderNumber)))}
                className="h-4 w-4 accent-brand-deep"
              />
              전체 선택 · 보낼 주문 {orders.length}건 · 상품 {orders.reduce((sum, o) => sum + totalQuantity(o), 0)}개
            </label>

            {orders.map((o) => (
              <ShipmentCard
                key={o.orderNumber}
                order={o}
                checked={selected.has(o.orderNumber)}
                onToggle={() => toggle(o.orderNumber)}
                onShip={() => ship(o)}
              />
            ))}
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <Card title={selected.size > 0 ? `포장 목록 (선택 ${selected.size}건)` : "포장 목록 (전체)"}>
              <ul className="space-y-2 text-[13px]">
                {picking.map((row) => (
                  <li key={`${row.name}|${row.option ?? ""}`} className="flex justify-between gap-3">
                    <span className="min-w-0">
                      {row.name}
                      {row.option ? <span className="block text-[12px] text-ink-subtle">{row.option}</span> : null}
                    </span>
                    <span className="whitespace-nowrap font-bold tabular-nums">{row.quantity}개</span>
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        </div>
      )}
    </>
  );
}

function ShipmentCard({
  order: o,
  checked,
  onToggle,
  onShip,
}: {
  order: AdminOrder;
  checked: boolean;
  onToggle: () => void;
  onShip: () => void;
}) {
  const s = o.shipping;
  return (
    <section
      className={`rounded-lg border bg-white p-4 md:p-5 ${checked ? "border-brand-deep" : "border-black/10"}`}
      aria-label={`주문 ${o.orderNumber}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-3">
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={checked} onChange={onToggle} className="h-4 w-4 accent-brand-deep" />
          <span className="font-bold tabular-nums">{o.orderNumber}</span>
          <span className="text-ink-subtle">결제 {formatDateTime(o.paidAt ?? o.orderedAt)}</span>
        </label>
        <Button size="sm" variant="primary" onClick={onShip}>
          배송중으로 변경
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="text-[14px] leading-[22px]">
          <p className="mb-1 text-[12px] font-medium text-ink-subtle">받는 분</p>
          {s ? (
            <>
              <p>
                <span className="font-bold">{s.recipientName}</span>
                <span className="ml-2 tabular-nums">{formatPhone(s.recipientPhone)}</span>
              </p>
              <p className="select-all">
                ({s.zipCode}) {s.roadAddress} {s.detailAddress}
              </p>
              {s.deliveryMemo ? (
                <p className="mt-1.5 rounded bg-brand-highlight px-2 py-1 text-[13px] text-brand-secondary">
                  요청사항: {s.deliveryMemo}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-[13px] text-brand-primary">
              배송지가 없는 주문입니다(배송지 입력 기능 이전 주문). 회원 정보에서 주소를 확인해 주세요.
            </p>
          )}
          {o.member ? (
            <p className="mt-1.5 text-[12px] text-ink-subtle">
              주문자 {o.member.name} ({o.member.loginId})
            </p>
          ) : null}
        </div>

        <div>
          <p className="mb-1 text-[12px] font-medium text-ink-subtle">상품 {totalQuantity(o)}개</p>
          <ul className="space-y-1.5 text-[14px]">
            {o.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="min-w-0">
                  {item.name}
                  {optionText(item.option) ? (
                    <span className="block text-[12px] text-ink-subtle">{optionText(item.option)}</span>
                  ) : null}
                </span>
                <span className="whitespace-nowrap font-bold tabular-nums">× {item.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-right text-[12px] text-ink-subtle">결제 {formatKRW(o.total)}</p>
        </div>
      </div>
    </section>
  );
}
