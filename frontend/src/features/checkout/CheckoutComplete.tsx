"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Container } from "@/components/layout/Container";
import { VirtualAccountInfo } from "@/components/order/VirtualAccountInfo";
import { errorMessage } from "@/lib/api/client";
import { confirmPayment } from "@/lib/api/orders";
import { useCartStore } from "@/lib/store/cart-store";
import { useRequireAuth } from "@/lib/store/use-require-auth";
import { formatKRW, formatPhone } from "@/lib/utils/format";
import type { Order } from "@/types/order";

/**
 * 결제 완료 화면(= 토스 successUrl). 넘어온 paymentKey·orderId(주문번호)·amount 로 서버에 결제 승인을 요청한다.
 * 금액은 서버가 주문 금액과 대조하고, 같은 요청이 두 번 와도 한 번만 처리된다(새로고침 안전).
 */
export function CheckoutComplete() {
  const ready = useRequireAuth();
  const params = useSearchParams();
  const loadCart = useCartStore((s) => s.load);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const orderNumber = params.get("orderId");
  const paymentKey = params.get("paymentKey");
  const amount = Number(params.get("amount"));
  const invalid = !orderNumber || !paymentKey || !Number.isFinite(amount);

  useEffect(() => {
    if (!ready || started.current || invalid) return;
    started.current = true;
    confirmPayment(orderNumber, paymentKey, amount)
      .then((confirmed) => {
        setOrder(confirmed);
        loadCart().catch(() => {});
      })
      .catch((e: unknown) => setError(errorMessage(e)));
  }, [ready, invalid, orderNumber, paymentKey, amount, loadCart]);

  if (error || invalid) {
    return (
      <Container className="flex flex-col items-center gap-5 py-[120px] text-center">
        <p className="text-[18px] font-medium">결제를 마치지 못했어요</p>
        <p role="alert" className="text-[14px] text-brand-primary">{error ?? "결제 정보가 올바르지 않습니다."}</p>
        <p className="text-[13px] text-ink-muted">주문은 결제대기로 남아 있으며 30분 뒤 자동 취소됩니다.</p>
        <div className="flex gap-3">
          <Link href="/cart" className="border-[1.5px] border-black px-6 py-3 text-[14px]">장바구니로</Link>
          <Link href="/mypage" className="border-[1.5px] border-black px-6 py-3 text-[14px]">주문 내역</Link>
        </div>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-[120px] text-center">
        <p className="text-[15px] text-ink-muted">결제를 확인하고 있어요…</p>
      </Container>
    );
  }

  const account = order.status === "AWAITING_DEPOSIT" ? order.payment?.virtualAccount : undefined;

  return (
    <Container className="mx-auto flex max-w-[560px] flex-col items-center py-[90px] text-center">
      <p className="text-[24px] font-medium tracking-[-0.4px]">{account ? "주문이 접수되었어요" : "주문이 완료되었어요"}</p>
      <p className="mt-2 text-[14px] text-ink-muted">주문번호 {order.orderNumber}</p>
      {account ? (
        <div className="mt-8 w-full border-[1.5px] border-brand-deep bg-white px-5 py-5">
          <p className="mb-3 text-left text-[14px] font-medium text-brand-deep">아래 계좌로 입금하면 주문이 완료돼요</p>
          <VirtualAccountInfo account={account} amount={order.total} />
        </div>
      ) : null}
      <dl className="mt-8 w-full space-y-3 border-y-[1.5px] border-black py-6 text-left text-[14px]">
        {order.shipping ? (
          <div className="flex gap-4">
            <dt className="w-20 flex-none text-ink-muted">배송지</dt>
            <dd>
              {order.shipping.recipientName} · {formatPhone(order.shipping.recipientPhone)}
              <br />({order.shipping.zipCode}) {order.shipping.roadAddress} {order.shipping.detailAddress}
              {order.shipping.deliveryMemo ? <span className="block text-ink-muted">{order.shipping.deliveryMemo}</span> : null}
            </dd>
          </div>
        ) : null}
        <div className="flex gap-4">
          <dt className="w-20 flex-none text-ink-muted">상품</dt>
          <dd>
            {order.items[0]?.name}
            {order.items.length > 1 ? ` 외 ${order.items.length - 1}건` : ""}
          </dd>
        </div>
        <div className="flex gap-4">
          <dt className="w-20 flex-none text-ink-muted">결제 금액</dt>
          <dd className="font-bold tabular-nums">{formatKRW(order.total)}</dd>
        </div>
        {order.payment?.method ? (
          <div className="flex gap-4">
            <dt className="w-20 flex-none text-ink-muted">결제 수단</dt>
            <dd>{order.payment.method === "가상계좌" ? "무통장입금" : order.payment.method}</dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-8 flex gap-3">
        <Link href="/mypage" className="border-[1.5px] border-black px-6 py-3 text-[14px] hover:bg-black hover:text-white">주문 내역 보기</Link>
        <Link href="/" className="border-[1.5px] border-black px-6 py-3 text-[14px] hover:bg-black hover:text-white">쇼핑 계속하기</Link>
      </div>
    </Container>
  );
}
