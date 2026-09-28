"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useIsLoggedIn } from "./auth-store";
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
    if (hydrated && !loggedIn) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, loggedIn, pathname, router]);

  return hydrated && loggedIn;
}
