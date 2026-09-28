/**
 * 백엔드(Spring Boot) API 호출 공통 모듈.
 *
 * 호출 위치가 두 곳이라 기준 주소도 둘이다.
 * - 빌드(서버 컴포넌트): `API_BASE_URL`. 정적 export 는 빌드 시점에 상품·공지 등을 받아 HTML 로 굳힌다.
 * - 브라우저: `NEXT_PUBLIC_API_BASE_URL`. 비어 있으면 같은 출처(`/api/...`)로 부른다.
 *   eatomato.kr 은 호스트 nginx 가 `/api` 를 백엔드로 넘기므로 비워 두고,
 *   GitHub Pages 처럼 출처가 다른 배포에서만 `https://eatomato.kr` 을 넣는다.
 *
 * 로컬 개발(`next dev`)은 두 값 모두 기본으로 `http://localhost:8080` 을 본다.
 *
 * 서버(운영 standalone)에서의 GET 은 60초 동안 캐시하고 그 뒤 백그라운드로 다시 받는다(ISR).
 * 관리자 화면의 변경이 스토어프론트에 최대 1분 늦게 반영되는 이유가 이것이다.
 * GitHub Pages 정적 export 빌드에서는 어차피 빌드 시점 한 번뿐이라 붙이지 않는다.
 */

const DEV_API_BASE_URL = "http://localhost:8080";

/** 서버 렌더 데이터 재검증 주기(초). */
const SERVER_REVALIDATE_SECONDS = 60;
const STATIC_EXPORT = process.env.GITHUB_PAGES === "true";

const BROWSER_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (process.env.NODE_ENV === "development" ? DEV_API_BASE_URL : "");

function baseUrl(): string {
  if (typeof window !== "undefined") return BROWSER_BASE_URL;
  return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || DEV_API_BASE_URL;
}

/** 브라우저에서 이동(location)에 쓸 API 절대·상대 주소. fetch 가 아닌 페이지 이동용. */
export function apiUrl(path: string): string {
  return `${baseUrl()}${path}`;
}

/** 백엔드 에러 응답(`{ code, message, errors }`)을 담는 예외. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 로그인 토큰 공급자.
 * 브라우저 전용 스토어(`lib/store/auth-store`)가 import 될 때 스스로 등록한다.
 * 이 파일은 빌드(서버)에서도 쓰이므로 스토어를 직접 import 하지 않는다.
 */
type AuthBridge = {
  /** 요청에 실을 액세스 토큰. 만료가 가까우면 리프레시 토큰으로 먼저 갱신한다. */
  getToken: () => Promise<string | null>;
  /** 서버가 401 을 주면 한 번 갱신을 시도한다. 새 액세스 토큰, 실패하면 null. */
  refresh: () => Promise<string | null>;
  onUnauthorized: () => void;
};

let authBridge: AuthBridge | null = null;

export function registerAuthBridge(bridge: AuthBridge) {
  authBridge = bridge;
}

type ApiInit = Omit<RequestInit, "body"> & {
  /**
   * true 면 Authorization 헤더를 붙인다. 토큰이 없으면 요청 없이 401 로 실패한다.
   * 서버가 401 을 주면 리프레시 토큰으로 갱신한 뒤 한 번 다시 보낸다.
   */
  auth?: boolean;
  /** JSON 본문. 지정하면 Content-Type 을 자동으로 붙인다. */
  json?: unknown;
  body?: BodyInit;
};

export async function apiFetch<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { auth = false, json, headers: initHeaders, body, ...rest } = init;
  const headers = new Headers(initHeaders);

  if (auth) {
    const token = await authBridge?.getToken();
    if (!token) throw new ApiError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (json !== undefined) headers.set("Content-Type", "application/json");

  const onServer = typeof window === "undefined";
  const send = () =>
    fetch(`${baseUrl()}${path}`, {
      ...(onServer && !auth && !STATIC_EXPORT && !rest.cache
        ? { next: { revalidate: SERVER_REVALIDATE_SECONDS } }
        : {}),
      ...rest,
      headers,
      body: json !== undefined ? JSON.stringify(json) : body,
    });

  let res = await send();
  if (res.status === 401 && auth) {
    // 토큰이 서버 기준으로 만료됐거나(시계 차이 등) 폐기된 경우. 갱신에 성공하면 한 번만 다시 보낸다.
    const renewed = await authBridge?.refresh();
    if (renewed) {
      headers.set("Authorization", `Bearer ${renewed}`);
      res = await send();
    }
  }

  if (!res.ok) {
    const error = (await res.json().catch(() => null)) as
      | { code?: string; message?: string }
      | null;
    // 갱신해도 401 이거나 이용 정지(403 MEMBER_DISABLED)면 세션을 비워 화면이 로그아웃 상태로 돌아가게 한다.
    if (auth && (res.status === 401 || error?.code === "MEMBER_DISABLED")) authBridge?.onUnauthorized();
    throw new ApiError(
      res.status,
      error?.code ?? `HTTP_${res.status}`,
      error?.message ?? "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** 404 를 `null` 로 바꿔 준다. 상세 조회에서 `notFound()` 처리를 쉽게 하려는 용도. */
export async function apiFetchOrNull<T>(path: string, init?: ApiInit): Promise<T | null> {
  try {
    return await apiFetch<T>(path, init);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** 화면에 보여 줄 에러 문구. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "서버와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
