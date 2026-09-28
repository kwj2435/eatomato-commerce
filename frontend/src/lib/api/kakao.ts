import type { AuthSession } from "@/types/auth";

import { safeNextPath } from "@/lib/utils/next-path";

import { apiFetch, apiUrl } from "./client";

/**
 * 카카오 로그인(REST API, 인가 코드 방식).
 *
 * 1) startKakaoLogin: state 난수와 돌아올 경로를 sessionStorage 에 두고, 백엔드의 /api/auth/kakao/authorize 로 이동
 *    → 백엔드가 카카오 인가 화면으로 302. (REST API 키를 프론트 번들에 넣지 않는다)
 * 2) 카카오가 /login/kakao/?code=…&state=… 로 돌려보낸다.
 * 3) completeKakaoLogin: state 가 같은지 확인하고 code 를 백엔드에 넘겨 우리 세션(JWT)을 받는다.
 *
 * redirect URI 는 카카오 콘솔과 백엔드 허용 목록(KAKAO_REDIRECT_URIS)에 등록된 값과 정확히 같아야 한다.
 */

const STATE_KEY = "eatomato-kakao-state";
const NEXT_KEY = "eatomato-kakao-next";

export function kakaoRedirectUri(): string {
  return `${window.location.origin}/login/kakao/`;
}

export function startKakaoLogin(nextPath: string): void {
  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(NEXT_KEY, nextPath);
  const qs = new URLSearchParams({ redirectUri: kakaoRedirectUri(), state });
  // replace: 로그인 화면을 방문 기록에 남기지 않는다. 로그인 후 뒤로가기로 로그인 화면이 다시 뜨지 않게.
  window.location.replace(apiUrl(`/api/auth/kakao/authorize?${qs}`));
}

/** 콜백 처리 없이 돌아갈 경로만 꺼낸다(이미 로그인된 상태로 콜백에 들어온 경우). */
export function takeKakaoNextPath(): string {
  const next = sessionStorage.getItem(NEXT_KEY) ?? "/mypage";
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(NEXT_KEY);
  return safeNextPath(next);
}

export type KakaoCallbackResult = { session: AuthSession; next: string };

export async function completeKakaoLogin(params: URLSearchParams): Promise<KakaoCallbackResult> {
  const expected = sessionStorage.getItem(STATE_KEY);
  const next = sessionStorage.getItem(NEXT_KEY) ?? "/mypage";
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(NEXT_KEY);

  if (params.get("error")) {
    // 사용자가 동의 화면에서 취소한 경우 등
    throw new Error(
      params.get("error") === "access_denied"
        ? "카카오 로그인을 취소했습니다."
        : "카카오 로그인에 실패했습니다. 다시 시도해 주세요.",
    );
  }
  const code = params.get("code");
  if (!code || !expected || params.get("state") !== expected) {
    throw new Error("로그인 요청이 올바르지 않습니다. 다시 시도해 주세요.");
  }

  const session = await apiFetch<AuthSession>("/api/auth/kakao", {
    method: "POST",
    json: { code, redirectUri: kakaoRedirectUri() },
  });
  return { session, next: safeNextPath(next) };
}
