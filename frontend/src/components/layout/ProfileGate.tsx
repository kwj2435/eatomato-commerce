"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { getMyMember } from "@/lib/api/member";
import { useAuthStore, useIsLoggedIn } from "@/lib/store/auth-store";
import { useHydrated } from "@/lib/store/use-hydrated";

/** 추가 정보 입력 없이도 머물 수 있는 화면. */
const ALLOWED = ["/signup/profile", "/login", "/signup", "/login/kakao"];

let refreshed = false;

/**
 * 가입 후 추가 정보(닉네임·주소)를 강제한다.
 * 로그인했는데 정보가 비어 있으면 어느 화면에 있든 추가 정보 입력(/signup/profile)으로 보낸다(관리자 제외).
 * 저장된 회원 정보가 오래됐을 수 있어 페이지를 처음 열 때 한 번 /api/me 로 새로 받는다.
 */
export function ProfileGate() {
  const hydrated = useHydrated();
  const loggedIn = useIsLoggedIn();
  const member = useAuthStore((s) => s.member);
  const setMember = useAuthStore((s) => s.setMember);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated || !loggedIn || refreshed) return;
    refreshed = true;
    getMyMember().then(setMember).catch(() => {});
  }, [hydrated, loggedIn, setMember]);

  useEffect(() => {
    if (!hydrated || !loggedIn || !member || member.profileComplete !== false) return;
    const path = pathname.replace(/\/$/, "") || "/";
    if (ALLOWED.some((allowed) => path === allowed || path.startsWith(`${allowed}/`))) return;
    router.replace(`/signup/profile?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, loggedIn, member, pathname, router]);

  return null;
}
