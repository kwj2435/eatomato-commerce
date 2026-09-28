"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { ApiError, apiFetch, registerAuthBridge } from "@/lib/api/client";
import type { AuthSession } from "@/types/auth";
import type { Member } from "@/types/member";

/**
 * 로그인 세션 스토어.
 *
 * 토큰 두 개를 localStorage 에 둔다.
 * - 액세스 토큰(30분): API 요청 Authorization 헤더에 싣는다.
 * - 리프레시 토큰(14일): 액세스 토큰이 만료되면 /api/auth/refresh 로 새 토큰 한 쌍을 받는다.
 *   쓸 때마다 새 값으로 바뀌고, 서버는 로그아웃·회원 정지 시 폐기한다.
 * 그래서 "로그인 유지" 는 리프레시 토큰이 살아 있는지로 판단한다.
 *
 * 여러 탭은 localStorage 를 공유하므로, 다른 탭의 로그인·로그아웃·토큰 교체를 storage 이벤트로 받아 맞춘다.
 */
type AuthState = {
  accessToken: string | null;
  /** epoch ms */
  expiresAt: number | null;
  refreshToken: string | null;
  refreshExpiresAt: number | null;
  member: Member | null;
  setSession: (session: AuthSession) => void;
  setMember: (member: Member) => void;
  clear: () => void;
};

const STORAGE_KEY = "eatomato-auth";
/** 만료 직전 토큰으로 요청했다가 도중에 만료되지 않도록 여유를 두고 미리 갱신한다. */
const REFRESH_MARGIN_MS = 60_000;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      expiresAt: null,
      refreshToken: null,
      refreshExpiresAt: null,
      member: null,
      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          expiresAt: Date.now() + session.expiresIn * 1000,
          refreshToken: session.refreshToken,
          refreshExpiresAt: Date.now() + session.refreshExpiresIn * 1000,
          member: session.member,
        }),
      setMember: (member) => set({ member }),
      clear: () =>
        set({ accessToken: null, expiresAt: null, refreshToken: null, refreshExpiresAt: null, member: null }),
    }),
    { name: STORAGE_KEY },
  ),
);

type Tokens = Pick<AuthState, "accessToken" | "expiresAt" | "refreshToken" | "refreshExpiresAt">;

function accessValid(s: Tokens, margin = 0): boolean {
  return !!s.accessToken && !!s.expiresAt && s.expiresAt - margin > Date.now();
}

function refreshValid(s: Tokens): boolean {
  return !!s.refreshToken && !!s.refreshExpiresAt && s.refreshExpiresAt > Date.now();
}

/** 로그인 상태인지(액세스 토큰이 만료됐어도 리프레시 토큰이 살아 있으면 로그인 유지). */
export function hasSession(): boolean {
  const s = useAuthStore.getState();
  return accessValid(s) || refreshValid(s);
}

/** 로그인 여부 구독 훅. */
export function useIsLoggedIn(): boolean {
  return useAuthStore((s) => accessValid(s) || refreshValid(s));
}

/** 다른 탭이 바꾼 토큰을 localStorage 에서 다시 읽는다. */
async function reloadFromStorage() {
  await useAuthStore.persist.rehydrate();
}

let refreshing: Promise<string | null> | null = null;

/**
 * 리프레시 토큰으로 새 토큰을 받는다. 동시에 여러 요청이 만료를 만나도 갱신 요청은 한 번만 보낸다.
 * 다른 탭이 먼저 교체해 둔 토큰이 있으면(이 탭이 가진 리프레시 토큰은 이미 폐기됨) 그것을 쓴다.
 *
 * @param force 서버가 401 을 준 경우. 이 탭 기준으로 아직 유효해 보여도 새로 받는다.
 */
function refreshSession(force = false): Promise<string | null> {
  refreshing ??= (async () => {
    const known = useAuthStore.getState().accessToken;
    await reloadFromStorage();
    const before = useAuthStore.getState();
    if (before.accessToken !== known && accessValid(before)) return before.accessToken;
    if (!force && accessValid(before, REFRESH_MARGIN_MS)) return before.accessToken;
    if (!refreshValid(before)) {
      useAuthStore.getState().clear();
      return null;
    }
    const used = before.refreshToken;
    try {
      const session = await apiFetch<AuthSession>("/api/auth/refresh", {
        method: "POST",
        json: { refreshToken: used },
      });
      useAuthStore.getState().setSession(session);
      return session.accessToken;
    } catch (error) {
      await reloadFromStorage();
      const after = useAuthStore.getState();
      if (after.refreshToken !== used && accessValid(after)) return after.accessToken;
      // 서버가 거절(만료·폐기·정지)했을 때만 로그아웃한다. 네트워크 오류면 세션을 남겨 두고 다음에 다시 시도.
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        useAuthStore.getState().clear();
      }
      return null;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** API 요청에 쓸 액세스 토큰. 만료가 가까우면 먼저 갱신한다. 로그인 상태가 아니면 null. */
async function getAccessToken(): Promise<string | null> {
  const s = useAuthStore.getState();
  if (accessValid(s, REFRESH_MARGIN_MS)) return s.accessToken;
  if (!refreshValid(s) && !accessValid(s)) return null;
  return refreshSession();
}

/** 로그아웃: 이 브라우저의 세션을 지우고, 서버에서 리프레시 토큰을 폐기한다. */
export function logout(): void {
  const { refreshToken } = useAuthStore.getState();
  useAuthStore.getState().clear();
  if (refreshToken) {
    apiFetch<void>("/api/auth/logout", { method: "POST", json: { refreshToken }, keepalive: true }).catch(() => {});
  }
}

registerAuthBridge({
  getToken: getAccessToken,
  refresh: () => refreshSession(true),
  onUnauthorized: () => useAuthStore.getState().clear(),
});

// 다른 탭의 로그인·로그아웃·토큰 교체를 이 탭에도 반영한다.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) void reloadFromStorage();
  });
}
