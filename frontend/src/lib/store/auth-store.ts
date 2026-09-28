"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { registerAuthBridge } from "@/lib/api/client";
import type { AuthSession } from "@/types/auth";
import type { Member } from "@/types/member";

/**
 * 로그인 세션 스토어.
 *
 * 정적 배포라 서버 세션 쿠키를 쓸 수 없어, 로그인 응답의 JWT 를 localStorage 에 보관한다.
 * 만료 시각을 함께 저장해 만료된 토큰은 요청 전에 걸러 낸다.
 */
type AuthState = {
  accessToken: string | null;
  /** epoch ms */
  expiresAt: number | null;
  member: Member | null;
  setSession: (session: AuthSession) => void;
  setMember: (member: Member) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      expiresAt: null,
      member: null,
      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          expiresAt: Date.now() + session.expiresIn * 1000,
          member: session.member,
        }),
      setMember: (member) => set({ member }),
      clear: () => set({ accessToken: null, expiresAt: null, member: null }),
    }),
    { name: "eatomato-auth" },
  ),
);

/** 유효한(만료되지 않은) 토큰. 없으면 null. */
export function currentToken(): string | null {
  const { accessToken, expiresAt } = useAuthStore.getState();
  if (!accessToken || !expiresAt || expiresAt <= Date.now()) return null;
  return accessToken;
}

/** 로그인 여부 구독 훅. */
export function useIsLoggedIn(): boolean {
  return useAuthStore(
    (s) => s.accessToken !== null && s.expiresAt !== null && s.expiresAt > Date.now(),
  );
}

registerAuthBridge({
  getToken: currentToken,
  onUnauthorized: () => useAuthStore.getState().clear(),
});
