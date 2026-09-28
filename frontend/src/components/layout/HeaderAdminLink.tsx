"use client";

import Link from "next/link";

import { useAuthStore, useIsLoggedIn } from "@/lib/store/auth-store";
import { useHydrated } from "@/lib/store/use-hydrated";

/**
 * 관리자로 로그인했을 때만 헤더에 관리자 화면 바로가기를 보인다.
 * 모바일 헤더는 가운데 로고와 우측 아이콘 사이가 좁아 데스크톱(lg)에서만 노출한다.
 */
export function HeaderAdminLink() {
  const hydrated = useHydrated();
  const loggedIn = useIsLoggedIn();
  const isAdmin = useAuthStore((s) => s.member?.role === "ADMIN");
  if (!hydrated || !loggedIn || !isAdmin) return null;
  return (
    <Link
      href="/admin"
      className="hidden rounded-full border border-brand-primary px-2 py-0.5 text-[11px] font-bold tracking-[0.5px] text-brand-primary transition-colors hover:bg-brand-primary hover:text-white lg:inline-block"
    >
      ADMIN
    </Link>
  );
}
