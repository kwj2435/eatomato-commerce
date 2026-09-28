"use client";

import Link from "next/link";

import { UserIcon } from "@/components/ui/icons";
import { useIsLoggedIn } from "@/lib/store/auth-store";
import { useHydrated } from "@/lib/store/use-hydrated";

/**
 * 헤더의 회원 아이콘. 로그인 상태를 한눈에 알 수 있게 한다.
 * - 로그인: 마이페이지로 가고, 아이콘 우측 아래에 작은 점을 찍는다.
 * - 비로그인: 로그인 화면으로 간다.
 * 하이드레이션 전에는 로그인 여부를 몰라 점 없이 마이페이지 링크로 그린다(마이페이지가 비로그인이면 로그인으로 보낸다).
 */
export function HeaderUserLink() {
  const hydrated = useHydrated();
  const loggedIn = useIsLoggedIn();
  const showLoggedIn = hydrated && loggedIn;
  const loggedOut = hydrated && !loggedIn;

  return (
    <Link
      href={loggedOut ? "/login" : "/mypage"}
      aria-label={loggedOut ? "로그인" : "마이페이지"}
      title={showLoggedIn ? "로그인됨 · 마이페이지" : loggedOut ? "로그인" : undefined}
      className="relative flex h-[22px] w-[22px] items-center justify-center transition-opacity hover:opacity-70"
    >
      <UserIcon />
      {showLoggedIn ? (
        <span aria-hidden className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-surface-primary bg-brand-primary" />
      ) : null}
    </Link>
  );
}
