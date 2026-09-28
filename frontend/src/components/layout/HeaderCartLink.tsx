"use client";

import Link from "next/link";
import { useEffect } from "react";

import { CartIcon } from "@/components/ui/icons";
import { useIsLoggedIn } from "@/lib/store/auth-store";
import { useCartStore } from "@/lib/store/cart-store";
import { useHydrated } from "@/lib/store/use-hydrated";

/**
 * 헤더의 장바구니 아이콘.
 *
 * 로그인 상태면 서버 장바구니를 한 번 불러와 담긴 개수를 우측 상단 뱃지로 표시한다.
 * 하이드레이션 이전에는 로그인 여부를 알 수 없으므로 뱃지를 감춘다 → hydration mismatch 없이 아이콘만 보인다.
 */
export function HeaderCartLink() {
  const hydrated = useHydrated();
  const loggedIn = useIsLoggedIn();
  const loaded = useCartStore((s) => s.loaded);
  const load = useCartStore((s) => s.load);
  const count = useCartStore((s) =>
    s.items.reduce((sum, it) => sum + it.quantity, 0),
  );

  useEffect(() => {
    // 뱃지는 부가 정보라 실패해도 조용히 넘어간다.
    if (hydrated && loggedIn && !loaded) load().catch(() => {});
  }, [hydrated, loggedIn, loaded, load]);

  const visible = hydrated && loggedIn && count > 0;

  return (
    <Link
      href="/cart"
      aria-label={`장바구니${visible ? ` (${count}개)` : ""}`}
      className="relative flex h-[22px] w-[22px] items-center justify-center transition-opacity hover:opacity-70"
    >
      <CartIcon />
      {visible ? (
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
