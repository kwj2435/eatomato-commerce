"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";

import { changeAdminOrderStatus, listAdminOrders } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { BANKS, bankName } from "@/lib/utils/banks";
import { formatKRW, formatPhone } from "@/lib/utils/format";
import type { AdminOrder, Page } from "@/types/admin";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/types/order";

import { formatDateTime } from "../format";
import { Button, Card, Empty, Field, Notice, PageHeader, Pagination, inputClass, tableClass, tdClass, thClass } from "../ui";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

const PAYMENT_LABELS = {
  READY: "결제 전",
  WAITING_FOR_DEPOSIT: "입금대기",
  DONE: "승인",
  CANCELED: "취소",
  FAILED: "실패",
} as const;

function isStatus(value: string | null): value is OrderStatus {
  return value !== null && (STATUSES as string[]).includes(value);
}

/**
 * 주문·결제 현황. 결제가 승인되면 "결제완료" 가 되고(PG 연동 전에는 MOCK 승인),
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

  const [refundFor, setRefundFor] = useState<AdminOrder | null>(null);

  const replace = (updated: AdminOrder) =>
    setData((prev) =>
      prev ? { ...prev, content: prev.content.map((o) => (o.orderNumber === updated.orderNumber ? updated : o)) } : prev,
    );

  const change = async (order: AdminOrder, next: OrderStatus) => {
    // 무통장입금으로 입금까지 받은 주문은 고객 환불 계좌를 받아야 취소(환불)할 수 있다.
    if (next === "CANCELLED" && order.status === "PAID" && order.payment?.virtualAccount) {
      setRefundFor(order);
      return;
    }
    const message =
      next === "CANCELLED"
        ? `주문 ${order.orderNumber} 을(를) 취소할까요?\n결제가 취소(환불)되고 재고가 복원됩니다.`
        : `주문 ${order.orderNumber} 을(를) '${ORDER_STATUS_LABELS[next]}'(으)로 바꿀까요?`;
    if (!window.confirm(message)) return;
    try {
      replace(await changeAdminOrderStatus(order.orderNumber, next));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader
        title="주문·결제"
        description="결제대기 → (무통장입금은 입금대기 →) 결제완료 → 배송중 → 배송완료 순서로만 바뀝니다. 취소는 배송 전까지 가능하며 환불·재고 복원이 함께 됩니다. 무통장입금으로 받은 주문을 취소하면 고객 환불 계좌를 입력합니다."
        actions={
          <Link
            href="/admin/shipments"
            className="inline-flex h-10 items-center rounded-md bg-brand-deep px-4 text-[14px] font-medium text-white hover:bg-brand-secondary"
          >
            배송 준비 화면
          </Link>
        }
      />
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
                          <span className="ml-1 text-[11px] text-ink-subtle">{expanded === o.orderNumber ? "접기 ▴" : "배송지·상품 ▾"}</span>
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
                        {/* 지금 상태에서 허용된 다음 상태만 고를 수 있다(서버 규칙과 같음). */}
                        <select
                          aria-label={`주문 ${o.orderNumber} 상태`}
                          value={o.status}
                          disabled={o.nextStatuses.length === 0}
                          onChange={(e) => change(o, e.target.value as OrderStatus)}
                          className="h-8 rounded-md border border-black/15 bg-white px-2 text-[13px] disabled:bg-black/[0.03] disabled:text-ink-subtle"
                        >
                          <option value={o.status}>{ORDER_STATUS_LABELS[o.status]}</option>
                          {o.nextStatuses.map((s) => (
                            <option key={s} value={s}>
                              → {ORDER_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {expanded === o.orderNumber ? (
                      <tr>
                        <td colSpan={6} className="border-b border-black/5 bg-black/[0.02] px-6 py-3">
                          <div className="mb-3 grid gap-3 text-[13px] md:grid-cols-2">
                            <div>
                              <p className="mb-1 font-bold">배송지</p>
                              {o.shipping ? (
                                <p className="leading-[20px]">
                                  {o.shipping.recipientName} · {formatPhone(o.shipping.recipientPhone)}
                                  <br />({o.shipping.zipCode}) {o.shipping.roadAddress} {o.shipping.detailAddress}
                                  {o.shipping.deliveryMemo ? (
                                    <span className="block text-ink-muted">요청: {o.shipping.deliveryMemo}</span>
                                  ) : null}
                                </p>
                              ) : (
                                <p className="text-ink-subtle">배송지 입력 기능 이전 주문</p>
                              )}
                            </div>
                            <div>
                              <p className="mb-1 font-bold">결제</p>
                              {o.payment ? (
                                <p className="leading-[20px]">
                                  {o.payment.provider}
                                  {o.payment.method ? ` · ${o.payment.method}` : ""} · {PAYMENT_LABELS[o.payment.status]} ·{" "}
                                  {formatKRW(o.payment.amount)}
                                  {o.payment.virtualAccount ? (
                                    <span className="block text-ink-muted">
                                      입금 계좌 {bankName(o.payment.virtualAccount.bankCode)} {o.payment.virtualAccount.accountNumber}
                                      {o.payment.virtualAccount.customerName ? ` (${o.payment.virtualAccount.customerName})` : ""}
                                    </span>
                                  ) : null}
                                  {o.payment.approvedAt ? <span className="block text-ink-muted">승인 {formatDateTime(o.payment.approvedAt)}</span> : null}
                                  {o.payment.paymentKey ? <span className="block break-all text-ink-subtle">{o.payment.paymentKey}</span> : null}
                                </p>
                              ) : (
                                <p className="text-ink-subtle">결제 기록 없음(이전 주문)</p>
                              )}
                            </div>
                          </div>
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
      {refundFor ? (
        <RefundAccountDialog
          order={refundFor}
          onClose={() => setRefundFor(null)}
          onDone={(updated) => {
            replace(updated);
            setRefundFor(null);
          }}
        />
      ) : null}
    </>
  );
}

/**
 * 무통장입금 주문 환불 계좌 입력. 토스가 이 계좌로 환불금을 보낸다(고객에게 받은 계좌를 그대로 넣는다).
 */
function RefundAccountDialog({
  order,
  onClose,
  onDone,
}: {
  order: AdminOrder;
  onClose: () => void;
  onDone: (updated: AdminOrder) => void;
}) {
  const [bank, setBank] = useState(BANKS[0].code);
  const [accountNumber, setAccountNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const digits = accountNumber.replace(/[^0-9]/g, "");
    if (digits.length < 6) return setError("계좌번호를 숫자로 입력해 주세요.");
    if (!holderName.trim()) return setError("예금주를 입력해 주세요.");
    setPending(true);
    setError(null);
    try {
      onDone(await changeAdminOrderStatus(order.orderNumber, "CANCELLED", { bank, accountNumber: digits, holderName: holderName.trim() }));
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="refund-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-[420px] rounded-lg bg-white p-6 shadow-xl">
        <h2 id="refund-title" className="text-[16px] font-bold">
          무통장입금 환불 계좌
        </h2>
        <p className="mt-1 text-[13px] leading-[19px] text-ink-muted">
          주문 {order.orderNumber} ({formatKRW(order.total)})을 취소하고 아래 계좌로 환불합니다. 고객에게 받은 계좌를 입력하세요.
        </p>
        <div className="mt-4 space-y-3">
          <Field label="은행" htmlFor="refund-bank">
            <select id="refund-bank" value={bank} onChange={(e) => setBank(e.target.value)} className={inputClass}>
              {BANKS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="계좌번호" htmlFor="refund-account">
            <input
              id="refund-account"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              inputMode="numeric"
              placeholder="숫자만"
              maxLength={24}
              className={inputClass}
            />
          </Field>
          <Field label="예금주" htmlFor="refund-holder">
            <input
              id="refund-holder"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              maxLength={60}
              className={inputClass}
            />
          </Field>
        </div>
        {error ? <p role="alert" className="mt-3 text-[13px] text-brand-primary">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onClose} disabled={pending}>
            닫기
          </Button>
          <Button type="submit" variant="danger" disabled={pending}>
            {pending ? "처리 중…" : "취소·환불"}
          </Button>
        </div>
      </form>
    </div>
  );
}
