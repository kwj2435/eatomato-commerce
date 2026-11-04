"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/product/ProductCard";
import { CartIcon } from "@/components/ui/icons";
import { errorMessage } from "@/lib/api/client";
import { formatKRW } from "@/lib/utils/format";
import { useCartStore, useCartSummary } from "@/lib/store/cart-store";
import { useHydrated } from "@/lib/store/use-hydrated";
import type { Product } from "@/types/product";

import { CartItemList } from "./CartItemList";
import { CartSummary } from "./CartSummary";

type CartViewProps = {
  /** 빈 장바구니에 보여 줄 추천 상품(BEST). 서버 페이지가 넘겨준다. */
  recommended: Product[];
};

/**
 * 장바구니 뷰 (클라이언트 셸).
 *
 * - 회원은 서버 장바구니, 비회원은 브라우저 장바구니를 쓴다(cart-store 가 구분한다).
 * - 장바구니를 불러오기 전에는 스켈레톤을 보여 준다.
 * - 빈 카트는 별도 empty state 로 대체(쇼핑 CTA + 추천 상품).
 * - 데스크톱(lg)은 상품 목록 | 결제 요약 2단, 그보다 좁으면 1단 + 하단 고정 주문 바.
 *   주문 바는 sticky 라 장바구니 영역을 스크롤하는 동안 따라오고, 푸터에 닿으면 그 위에 멈춘다.
 * - "주문하기" 는 주문서(/checkout)로 넘어간다. 결제는 주문서에서 한다. 비회원은 주문서에서 주문자 정보를 받는다.
 */
export function CartView({ recommended }: CartViewProps) {
  const ready = useHydrated();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const loaded = useCartStore((s) => s.loaded);
  const load = useCartStore((s) => s.load);
  const error = useCartStore((s) => s.error);
  const { itemCount, selectedCount, total } = useCartSummary();
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
  const hasItems = ready && loaded && items.length > 0;

  return (
    <section className="mt-[25px] w-full bg-surface-primary pt-7 pb-[39px] md:pb-[100px] lg:pt-10">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[22px] font-bold tracking-[-0.5px] text-ink-primary lg:text-[26px]">
            장바구니
            <span className="ml-1.5 text-brand-primary">{loaded ? itemCount : "…"}</span>
          </h1>
          <ol aria-label="주문 단계" className="hidden items-center gap-2.5 text-[13px] text-ink-subtle lg:flex">
            <li aria-current="step" className="font-semibold text-ink-primary">
              01 장바구니
            </li>
            <li aria-hidden className="text-[#CCCCCC]">›</li>
            <li>02 주문서 작성</li>
            <li aria-hidden className="text-[#CCCCCC]">›</li>
            <li>03 주문 완료</li>
          </ol>
        </div>

        {!ready || !loaded ? (
          <CartSkeleton />
        ) : items.length === 0 ? (
          <EmptyCart recommended={recommended} />
        ) : (
          <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-12">
            <CartItemList items={items} />
            <CartSummary
              message={message}
              action={
                <button
                  type="button"
                  onClick={handleOrder}
                  className="flex h-14 w-full items-center justify-center bg-ink-primary text-[16px] font-semibold tracking-[-0.2px] text-ink-inverse transition-opacity hover:opacity-90"
                >
                  {formatKRW(total)} 주문하기
                </button>
              }
            />
          </div>
        )}

        {/* 장바구니 화면 밖(불러오기 실패 등)의 안내. 상품이 있으면 요약 카드·주문 바가 대신 보여 준다. */}
        {message && !hasItems ? (
          <p role="alert" className="mt-6 text-right text-[13px] text-brand-primary">
            {message}
          </p>
        ) : null}
      </Container>

      {hasItems ? (
        <div className="sticky bottom-0 z-10 mt-8 border-t border-[#F0E2DE] bg-surface-elevated px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] shadow-[0_-6px_18px_rgba(33,33,33,0.06)] md:px-8 lg:hidden">
          {message ? (
            <p role="alert" className="mb-2 text-[12.5px] text-brand-primary">
              {message}
            </p>
          ) : null}
          <div className="flex items-center gap-3.5">
            <div className="flex-none leading-tight">
              <span className="block text-[12px] text-ink-subtle">총 결제금액</span>
              <strong className="text-[18px] font-extrabold text-ink-primary">{formatKRW(total)}</strong>
            </div>
            <button
              type="button"
              onClick={handleOrder}
              className="flex h-[50px] flex-1 items-center justify-center bg-ink-primary text-[15px] font-semibold tracking-[-0.2px] text-ink-inverse"
            >
              주문하기
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CartSkeleton() {
  return (
    <div className="mt-7 space-y-4">
      <div className="h-14 w-full animate-pulse bg-black/[0.06]" />
      <div className="h-[142px] w-full animate-pulse bg-black/[0.04]" />
      <div className="h-[142px] w-full animate-pulse bg-black/[0.04]" />
    </div>
  );
}

function EmptyCart({ recommended }: { recommended: Product[] }) {
  return (
    <>
      <div className="flex flex-col items-center pt-14 pb-2 text-center">
        <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-brand-highlight text-brand-primary">
          <CartIcon width={32} height={32} />
        </span>
        <p className="mt-5 text-[18px] font-bold tracking-[-0.3px] text-ink-primary">장바구니가 비어 있어요</p>
        <p className="mt-2 text-[14px] text-ink-muted">마음에 드는 상품을 담아보세요.</p>
        <Link
          href="/products/phone-case"
          className="mt-6 inline-flex h-[52px] items-center justify-center bg-ink-primary px-10 text-[15px] font-semibold text-ink-inverse transition-opacity hover:opacity-90"
        >
          쇼핑하러 가기
        </Link>
      </div>

      {recommended.length > 0 ? (
        <section aria-labelledby="cart-recommended-title" className="mt-16">
          <h2 id="cart-recommended-title" className="mb-[18px] text-[17px] font-bold tracking-[-0.3px] text-ink-primary">
            지금 많이 찾는 상품
          </h2>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-6">
            {recommended.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
