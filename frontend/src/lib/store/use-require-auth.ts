"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { justLoggedOut, useIsLoggedIn } from "./auth-store";
import { useHydrated } from "./use-hydrated";

/**
 * 로그인이 필요한 화면에서 쓴다. 비로그인이면 로그인 페이지로 보내고, 로그인 후 원래 화면으로 돌아온다.
 * 반환값이 true 일 때만 회원 데이터를 불러오면 된다.
 */
export function useRequireAuth(): boolean {
  const hydrated = useHydrated();
  const loggedIn = useIsLoggedIn();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 직접 로그아웃했으면 로그아웃한 쪽이 정한 화면(메인)으로 가게 둔다.
    if (hydrated && !loggedIn && !justLoggedOut()) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, loggedIn, pathname, router]);

  return hydrated && loggedIn;
}
