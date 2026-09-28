"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Container } from "@/components/layout/Container";
import { errorMessage } from "@/lib/api/client";
import { createOrder } from "@/lib/api/orders";
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
 */
export function CartView() {
  const ready = useRequireAuth();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const loaded = useCartStore((s) => s.loaded);
  const load = useCartStore((s) => s.load);
  const error = useCartStore((s) => s.error);
  const { itemCount, selectedCount } = useCartSummary();
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // 다른 기기에서 담은 상품도 보이도록 장바구니 화면에 들어올 때마다 새로 불러온다.
  useEffect(() => {
    if (!ready) return;
    load().catch((e: unknown) => useCartStore.setState({ error: errorMessage(e) }));
  }, [ready, load]);

  const handleOrder = async () => {
    if (selectedCount === 0) {
      setOrderError("주문할 상품을 선택해 주세요.");
      return;
    }
    setOrdering(true);
    setOrderError(null);
    try {
      await createOrder();
      await load();
      router.push("/mypage");
    } catch (e) {
      setOrderError(errorMessage(e));
      setOrdering(false);
    }
  };

  const message = orderError ?? error;

  return (
    <section className="mt-[25px] w-full bg-[#FEF3EE] py-[34px] pb-[39px] md:pb-[100px]">
      <Container>
        <p className="text-[16px] font-normal leading-5 tracking-[-0.3px] text-black">
          80,000원 이상 구매시 무료배송 ({loaded ? itemCount : "…"})
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
                disabled={ordering}
                className="h-[58px] w-[173px] border-[1.5px] border-black text-[15px] font-normal tracking-[-0.2px] transition-colors hover:bg-black hover:text-white disabled:opacity-50"
              >
                {ordering ? "주문 중…" : "바로 구매하기"}
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
