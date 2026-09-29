"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { nextPathFromLocation } from "@/lib/utils/next-path";

import { useIsLoggedIn } from "./auth-store";
import { useHydrated } from "./use-hydrated";

/**
 * 로그인·가입 화면용. 이미 로그인돼 있으면 `?next=`(없으면 메인)로 바로 보낸다.
 * 뒤로가기로 로그인 화면에 돌아왔을 때 빈 로그인 폼이 떠서 "로그인이 풀린 것처럼" 보이는 것을 막는다.
 * 반환값이 true 면 이동 중이니 폼을 그리지 않는다.
 */
export function useRedirectIfLoggedIn(): boolean {
  const hydrated = useHydrated();
  const loggedIn = useIsLoggedIn();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && loggedIn) router.replace(nextPathFromLocation());
  }, [hydrated, loggedIn, router]);

  return hydrated && loggedIn;
}
