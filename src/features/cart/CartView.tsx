"use client";

import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { useCartStore, useCartSummary } from "@/lib/store/cart-store";
import { useHydrated } from "@/lib/store/use-hydrated";

import { CartSummary } from "./CartSummary";
import { CartTable } from "./CartTable";
import { PaymentWidgets } from "./PaymentWidgets";

/**
 * 장바구니 뷰 (클라이언트 셸).
 *
 * - 스토어에서 items 를 구독한다.
 * - persist 하이드레이션 이전에는 스켈레톤을 유지해 SSR 마크업과 다르지 않게 한다.
 * - 빈 카트는 별도 empty state 로 대체(상품 리스트로 이동 CTA 포함).
 */
export function CartView() {
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const { itemCount } = useCartSummary();

  return (
    <section className="mt-[25px] w-full bg-[#FEF3EE] py-[34px] pb-[39px] md:pb-[100px]">
      <Container>
        <p className="text-[16px] font-normal leading-5 tracking-[-0.3px] text-black">
          80,000원 이상 구매시 무료배송 ({hydrated ? itemCount : "…"})
        </p>

        {!hydrated ? (
          <CartSkeleton />
        ) : items.length === 0 ? (
          <EmptyCart />
        ) : (
          <>
            <CartTable items={items} />
            <CartSummary />

            <div className="mt-[68px] flex justify-end">
              <button
                type="button"
                className="h-[58px] w-[173px] border-[1.5px] border-black text-[15px] font-normal tracking-[-0.2px] transition-colors hover:bg-black hover:text-white"
              >
                바로 구매하기
              </button>
            </div>

            <PaymentWidgets />
          </>
        )}
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
