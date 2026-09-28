/**
 * 로그인 후 돌아갈 경로. 같은 사이트 경로(`/...`)만 받아 외부 주소로 튕겨 나가지 않게 한다.
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/mypage"): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}

/** 현재 주소의 `?next=` 값. `useSearchParams` 대신 써서 정적 export 에서 Suspense 경계가 필요 없다. */
export function nextPathFromLocation(fallback = "/mypage"): string {
  return safeNextPath(new URLSearchParams(window.location.search).get("next"), fallback);
}
