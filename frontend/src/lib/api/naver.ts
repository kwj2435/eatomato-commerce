import type { AuthSession } from "@/types/auth";

import { safeNextPath } from "@/lib/utils/next-path";

import { apiFetch, apiUrl } from "./client";

/**
 * 네이버 로그인(인가 코드 방식). 흐름은 카카오(kakao.ts)와 같다.
 *
 * 1) startNaverLogin: state 난수와 돌아올 경로를 sessionStorage 에 두고 백엔드 /api/auth/naver/authorize 로 이동
 *    → 백엔드가 네이버 로그인 화면으로 302. (Client ID 를 프론트 번들에 넣지 않는다)
 * 2) 네이버가 /login/naver/?code=…&state=… 로 돌려보낸다(네이버 콘솔의 Callback URL).
 * 3) completeNaverLogin: state 가 같은지 확인하고 code·state 를 백엔드에 넘겨 우리 세션(JWT)을 받는다.
 */

const STATE_KEY = "eatomato-naver-state";
const NEXT_KEY = "eatomato-naver-next";

export function naverRedirectUri(): string {
  return `${window.location.origin}/login/naver/`;
}

export function startNaverLogin(nextPath: string): void {
  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(NEXT_KEY, nextPath);
  const qs = new URLSearchParams({ redirectUri: naverRedirectUri(), state });
  window.location.replace(apiUrl(`/api/auth/naver/authorize?${qs}`));
}

/** 콜백 처리 없이 돌아갈 경로만 꺼낸다(이미 로그인된 상태로 콜백에 들어온 경우). */
export function takeNaverNextPath(): string {
  const next = sessionStorage.getItem(NEXT_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(NEXT_KEY);
  return safeNextPath(next);
}

export async function completeNaverLogin(params: URLSearchParams): Promise<{ session: AuthSession; next: string }> {
  const expected = sessionStorage.getItem(STATE_KEY);
  const next = sessionStorage.getItem(NEXT_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(NEXT_KEY);

  if (params.get("error")) {
    // 사용자가 동의 화면에서 취소한 경우 등
    throw new Error(
      params.get("error") === "access_denied"
        ? "네이버 로그인을 취소했습니다."
        : "네이버 로그인에 실패했습니다. 다시 시도해 주세요.",
    );
  }
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !expected || state !== expected) {
    throw new Error("로그인 요청이 올바르지 않습니다. 다시 시도해 주세요.");
  }

  const session = await apiFetch<AuthSession>("/api/auth/naver", {
    method: "POST",
    json: { code, state, redirectUri: naverRedirectUri() },
  });
  return { session, next: safeNextPath(next) };
}
