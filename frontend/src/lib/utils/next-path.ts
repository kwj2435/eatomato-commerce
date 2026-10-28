/** 로그인·가입 후 기본으로 가는 곳. 로그인이 필요한 화면에서 넘어왔으면(`?next=`) 그 화면으로 돌아간다. */
export const AFTER_LOGIN_PATH = "/";

/** 출처 비교용 가상의 기준 주소. 실제로 접속하지 않는다. */
const SAME_ORIGIN_BASE = "https://same-origin.invalid";

/**
 * 로그인 후 돌아갈 경로. 같은 사이트 경로(`/...`)만 받아 외부 주소로 튕겨 나가지 않게 한다.
 *
 * `//evil.com` 만 막으면 부족하다. 브라우저는 `/\evil.com`, `/<탭>/evil.com` 도 `https://evil.com` 으로 읽는다.
 * 그래서 백슬래시·제어문자를 거르고, URL 로 해석했을 때 출처가 그대로인지 한 번 더 본다.
 */
export function safeNextPath(raw: string | null | undefined, fallback = AFTER_LOGIN_PATH): string {
  if (!raw || !raw.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(raw)) return fallback;
  try {
    const url = new URL(raw, SAME_ORIGIN_BASE);
    return url.origin === SAME_ORIGIN_BASE ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
}

/** 로그인 직후 갈 곳. 추가 정보(닉네임·주소)가 비어 있으면 그 입력 화면을 먼저 거친다. */
export function afterLoginPath(profileComplete: boolean): string {
  const next = nextPathFromLocation();
  return profileComplete ? next : `/signup/profile?next=${encodeURIComponent(next)}`;
}

/** 현재 주소의 `?next=` 값. `useSearchParams` 대신 써서 정적 export 에서 Suspense 경계가 필요 없다. */
export function nextPathFromLocation(fallback = AFTER_LOGIN_PATH): string {
  return safeNextPath(new URLSearchParams(window.location.search).get("next"), fallback);
}
