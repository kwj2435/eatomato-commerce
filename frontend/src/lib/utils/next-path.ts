/** 로그인·가입 후 기본으로 가는 곳. 로그인이 필요한 화면에서 넘어왔으면(`?next=`) 그 화면으로 돌아간다. */
export const AFTER_LOGIN_PATH = "/";

/**
 * 로그인 후 돌아갈 경로. 같은 사이트 경로(`/...`)만 받아 외부 주소로 튕겨 나가지 않게 한다.
 */
export function safeNextPath(raw: string | null | undefined, fallback = AFTER_LOGIN_PATH): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}

/** 현재 주소의 `?next=` 값. `useSearchParams` 대신 써서 정적 export 에서 Suspense 경계가 필요 없다. */
export function nextPathFromLocation(fallback = AFTER_LOGIN_PATH): string {
  return safeNextPath(new URLSearchParams(window.location.search).get("next"), fallback);
}
