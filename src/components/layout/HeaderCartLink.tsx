"use client";

import Link from "next/link";

import { CartIcon } from "@/components/ui/icons";
import { useCartStore } from "@/lib/store/cart-store";
import { useHydrated } from "@/lib/store/use-hydrated";

/**
 * 헤더의 장바구니 아이콘.
 *
 * 스토어에서 총 담긴 개수를 구독해 우측 상단 뱃지로 표시한다.
 * SSR 시점에는 개수를 알 수 없으므로 하이드레이션 이전에는 뱃지를 감춘다
 * → hydration mismatch 없이 아이콘만 보인다.
 */
export function HeaderCartLink() {
  const hydrated = useHydrated();
  const count = useCartStore((s) =>
    s.items.reduce((sum, it) => sum + it.quantity, 0),
  );

  return (
    <Link
      href="/cart"
      aria-label={`장바구니${hydrated && count > 0 ? ` (${count}개)` : ""}`}
      className="relative flex h-[22px] w-[22px] items-center justify-center transition-opacity hover:opacity-70"
    >
      <CartIcon />
      {hydrated && count > 0 ? (
        <span
          aria-hidden
          className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-bold leading-none text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
