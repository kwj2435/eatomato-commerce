"use client";

import Link from "next/link";
import { useState } from "react";

import { VirtualAccountInfo } from "@/components/order/VirtualAccountInfo";
import { AuthField as Field } from "@/features/auth/AuthField";
import { errorMessage } from "@/lib/api/client";
import { cancelGuestOrder, lookupGuestOrder } from "@/lib/api/guest";
import { formatKRW, formatNoticeDate, formatPhone } from "@/lib/utils/format";
import { ORDER_STATUS_LABELS, type Order } from "@/types/order";

/**
 * 비회원 주문 조회. 주문번호 + 주문 비밀번호(주문서에서 정한 값)로 주문을 불러오고, 배송 전이면 취소할 수 있다.
 * 비밀번호를 여러 번 틀리면 서버가 잠시 막는다.
 */
export function GuestOrderLookup() {
  const [orderNumber, setOrderNumber] = useState("");
  const [password, setPassword] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!orderNumber.trim() || !password) {
      setError("주문번호와 주문 비밀번호를 모두 입력해 주세요.");
      return;
    }
    setPending(true);
    try {
      setOrder(await lookupGuestOrder(orderNumber.trim(), password));
      setError(null);
    } catch (e) {
      setOrder(null);
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };

  const cancel = async (target: Order) => {
    const message =
      target.status === "PAID"
        ? "주문을 취소할까요? 결제가 취소(환불)됩니다."
        : target.status === "AWAITING_DEPOSIT"
          ? "주문을 취소할까요? 안내받은 입금 계좌는 더 이상 쓸 수 없습니다."
          : "주문을 취소할까요?";
    if (!window.confirm(message)) return;
    try {
      setOrder(await cancelGuestOrder(target.orderNumber, password));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-6 md:px-3.5 md:py-2.5">
      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-[446px] flex-col">
        <h1 className="text-center text-[18px] font-medium tracking-[-0.3px]">비회원 주문 조회</h1>
        <Field
          label="주문번호"
          id="guest-order-number"
          type="text"
          autoComplete="off"
          value={orderNumber}
          onChange={(v) => setOrderNumber(v.replace(/[^0-9]/g, ""))}
          className="mt-[30px]"
          inputProps={{ inputMode: "numeric", maxLength: 30, placeholder: "주문 완료 화면의 주문번호" }}
        />
        <Field
          label="주문 비밀번호"
          id="guest-order-pw"
          type="password"
          autoComplete="off"
          value={password}
          onChange={setPassword}
          className="mt-[25px]"
          inputProps={{ maxLength: 20 }}
        />
        <button
          type="submit"
          disabled={pending}
          className="mx-auto mt-[40px] h-[59px] w-full max-w-[264px] border border-black text-[15px] tracking-[-0.2px] transition-colors hover:bg-black hover:text-white disabled:opacity-50"
        >
          {pending ? "조회 중…" : "주문 조회하기"}
        </button>
        <p className="mt-5 text-center text-[13px] text-ink-muted">
          회원이신가요?{" "}
          <Link href="/login?next=%2Fmypage" className="underline underline-offset-2">
            로그인하고 주문 내역 보기
          </Link>
        </p>
      </form>

      {error ? (
        <p role="alert" className="mt-6 text-center text-[13px] text-brand-primary">
          {error}
        </p>
      ) : null}

      {order ? <GuestOrderCard order={order} onCancel={() => cancel(order)} /> : null}
    </div>
  );
}

function GuestOrderCard({ order, onCancel }: { order: Order; onCancel: () => void }) {
  const account = order.status === "AWAITING_DEPOSIT" ? order.payment?.virtualAccount : undefined;
  return (
    <section className="mt-10 border-t border-black py-4 text-[13px] tracking-[-0.2px]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[#777]">
          {formatNoticeDate(order.orderedAt)} · 주문번호 {order.orderNumber}
        </span>
        <span className="flex-none">
          <span className={order.status === "CANCELLED" ? "mr-2 text-[#999]" : "mr-2 font-medium text-brand-primary"}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <span className="font-bold text-black">{formatKRW(order.total)}</span>
        </span>
      </div>
      <ul className="mt-3 space-y-1 border-b border-black/20 pb-3">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3 text-black">
            <Link href={`/products/${item.slug}`} className="min-w-0 truncate hover:underline">
              {item.name}
              {item.option ? <span className="text-[#777]"> ({item.option})</span> : null}
            </Link>
            <span className="flex-none text-[#545454]">{item.quantity}개</span>
          </li>
        ))}
      </ul>
      <dl className="mt-3 space-y-1.5">
        <div className="flex gap-4">
          <dt className="w-16 flex-none text-ink-muted">상품 합계</dt>
          <dd className="tabular-nums">{formatKRW(order.subtotal)}</dd>
        </div>
        <div className="flex gap-4">
          <dt className="w-16 flex-none text-ink-muted">배송비</dt>
          <dd className="tabular-nums">{order.shippingFee === 0 ? "무료" : formatKRW(order.shippingFee)}</dd>
        </div>
        {order.shipping ? (
          <div className="flex gap-4">
            <dt className="w-16 flex-none text-ink-muted">배송지</dt>
            <dd>
              {order.shipping.recipientName} · {formatPhone(order.shipping.recipientPhone)}
              <br />({order.shipping.zipCode}) {order.shipping.roadAddress} {order.shipping.detailAddress}
              {order.shipping.deliveryMemo ? <span className="block text-ink-muted">{order.shipping.deliveryMemo}</span> : null}
            </dd>
          </div>
        ) : null}
      </dl>
      {account ? (
        <VirtualAccountInfo account={account} amount={order.total} className="mt-3 border border-brand-deep/40 bg-white px-3 py-2.5" />
      ) : null}
      {order.status === "PAID" && !order.cancellable && order.payment?.virtualAccount ? (
        <p className="mt-2 text-right text-[12px] text-[#999]">무통장입금 주문 취소는 고객센터로 요청해 주세요.</p>
      ) : null}
      {order.cancellable ? (
        <div className="mt-3 text-right">
          <button
            type="button"
            onClick={onCancel}
            className="text-[12px] text-[#777] underline-offset-2 hover:text-black hover:underline"
          >
            주문 취소
          </button>
        </div>
      ) : null}
    </section>
  );
}
