"use client";

import { useRouter } from "next/navigation";

import { logout } from "@/lib/store/auth-store";

/**
 * 로그아웃하고 메인으로 보낸다. 헤더 메뉴·모바일 메뉴·마이페이지에서 같이 쓴다.
 * 서버에서 리프레시 토큰을 폐기하고(logout), 장바구니는 auth 스토어 구독으로 비워진다.
 */
export function useLogout(): () => void {
  const router = useRouter();
  return () => {
    logout();
    router.push("/");
  };
}
