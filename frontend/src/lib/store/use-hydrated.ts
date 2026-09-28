"use client";

import { useSyncExternalStore } from "react";

import { useAuthStore } from "./auth-store";

/**
 * 로그인 세션(localStorage)의 하이드레이션 완료 여부를 반환한다.
 *
 * `useSyncExternalStore` 는 React 19 에서 외부 스토어와 동기화하는 정통 훅이다.
 * - 서버 스냅샷은 항상 `false` → 정적 HTML 이 "미 하이드레이션" 상태로 그려진다.
 * - 클라이언트에서는 persist 의 `hasHydrated()` 를 스냅샷으로 쓴다.
 *
 * 로그인 여부에 따라 화면이 갈리는 곳(장바구니·마이페이지 등)은 이 값이 true 가 된 뒤에 판단해야
 * "로그인했는데 잠깐 로그인 안내가 보이는" 깜빡임과 hydration mismatch 를 막을 수 있다.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeHydration, getClientSnapshot, getServerSnapshot);
}

function subscribeHydration(onChange: () => void): () => void {
  const unsubscribe = useAuthStore.persist?.onFinishHydration?.(onChange);
  return () => unsubscribe?.();
}

function getClientSnapshot(): boolean {
  return useAuthStore.persist?.hasHydrated?.() ?? false;
}

function getServerSnapshot(): boolean {
  return false;
}
