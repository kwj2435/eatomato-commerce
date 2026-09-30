"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Container } from "@/components/layout/Container";
import { errorMessage } from "@/lib/api/client";
import { formatKRW } from "@/lib/utils/format";
import { useCartStore, useCartSummary } from "@/lib/store/cart-store";
import { useRequireAuth } from "@/lib/store/use-require-auth";

import { CartSummary } from "./CartSummary";
import { CartTable } from "./CartTable";
import { PaymentWidgets } from "./PaymentWidgets";

/**
 * 장바구니 뷰 (클라이언트 셸).
 *
 * - 로그인이 필요하다. 비로그인이면 로그인 페이지로 보낸다(`useRequireAuth`).
 * - 서버 장바구니를 불러오기 전에는 스켈레톤을 보여 준다.
 * - 빈 카트는 별도 empty state 로 대체(상품 리스트로 이동 CTA 포함).
 * - "주문하기" 는 주문서(/checkout)로 넘어간다. 결제는 주문서에서 한다.
 */
export function CartView() {
  const ready = useRequireAuth();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const loaded = useCartStore((s) => s.loaded);
  const load = useCartStore((s) => s.load);
  const error = useCartStore((s) => s.error);
  const policy = useCartStore((s) => s.policy);
  const { itemCount, selectedCount, freeShippingRemainder, subtotal } = useCartSummary();
  const [orderError, setOrderError] = useState<string | null>(null);

  // 다른 기기에서 담은 상품도 보이도록 장바구니 화면에 들어올 때마다 새로 불러온다.
  useEffect(() => {
    if (!ready) return;
    load().catch((e: unknown) => useCartStore.setState({ error: errorMessage(e) }));
  }, [ready, load]);

  /** 주문서로 넘어간다. 품절·재고 부족 상품이 선택돼 있으면 먼저 정리하게 한다. */
  const handleOrder = () => {
    if (selectedCount === 0) {
      setOrderError("주문할 상품을 선택해 주세요.");
      return;
    }
    if (items.some((it) => it.selected && !it.available)) {
      setOrderError("품절되었거나 재고가 부족한 상품이 있어요. 수량을 줄이거나 삭제해 주세요.");
      return;
    }
    setOrderError(null);
    router.push("/checkout");
  };

  const message = orderError ?? error;

  return (
    <section className="mt-[25px] w-full bg-surface-primary py-[34px] pb-[39px] md:pb-[100px]">
      <Container>
        <p className="text-[16px] font-normal leading-5 tracking-[-0.3px] text-black">
          장바구니 ({loaded ? itemCount : "…"})
          {policy && policy.freeThreshold > 0 && subtotal > 0 ? (
            <span className="ml-2 text-[14px] text-ink-muted">
              {freeShippingRemainder > 0
                ? `${formatKRW(freeShippingRemainder)} 더 담으면 무료배송`
                : "무료배송 조건을 채웠어요"}
            </span>
          ) : null}
        </p>

        {!ready || !loaded ? (
          <CartSkeleton />
        ) : items.length === 0 ? (
          <EmptyCart />
        ) : (
          <>
            <CartTable items={items} />
            <CartSummary />

            <div className="mt-[68px] flex flex-col items-end gap-4">
              <button
                type="button"
                onClick={handleOrder}
                className="h-[58px] w-[173px] border-[1.5px] border-black text-[15px] font-normal tracking-[-0.2px] transition-colors hover:bg-black hover:text-white"
              >
                주문하기
              </button>
            </div>

            <PaymentWidgets />
          </>
        )}

        {message ? (
          <p role="alert" className="mt-6 text-right text-[13px] text-brand-primary">
            {message}
          </p>
        ) : null}
      </Container>
    </section>
  );
}

function CartSkeleton() {
  return (
    <div className="mt-[46px] space-y-4">
      <div className="h-14 w-full animate-pulse bg-black/[0.06]" />
      <div className="h-[142px] w-full animate-pulse bg-black/[0.04]" />
      <div className="h-[142px] w-full animate-pulse bg-black/[0.04]" />
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="mt-[80px] flex flex-col items-center gap-6 py-[100px]">
      <p className="text-[16px] text-ink-muted">장바구니가 비어 있어요.</p>
      <Link
        href="/products/phone-case"
        className="inline-flex h-[52px] items-center justify-center border-[1.5px] border-black px-8 text-[15px] font-medium transition-colors hover:bg-black hover:text-white"
      >
        쇼핑하러 가기
      </Link>
    </div>
  );
}
