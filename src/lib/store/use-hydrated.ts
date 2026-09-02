"use client";

import { useSyncExternalStore } from "react";

import { useCartStore } from "./cart-store";

/**
 * Zustand persist 미들웨어의 하이드레이션 완료 여부를 반환한다.
 *
 * `useSyncExternalStore` 는 React 19 에서 외부 스토어와 동기화하는 정통 훅이다.
 * - 서버 스냅샷은 항상 `false` → SSR HTML 이 "미 하이드레이션" 상태로 그려진다.
 * - 클라이언트에서는 persist 의 `hasHydrated()` 를 스냅샷으로 쓴다.
 * - `subscribe` 는 persist 가 알려주는 완료 이벤트에 연결한다.
 *
 * 이 조합으로 SSR 시점의 hydration mismatch 를 원천 차단하면서
 * useEffect 안에서 setState 를 부르는 안티패턴도 피한다.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeHydration, getClientSnapshot, getServerSnapshot);
}

function subscribeHydration(onChange: () => void): () => void {
  const unsubscribe = useCartStore.persist?.onFinishHydration?.(onChange);
  return () => unsubscribe?.();
}

function getClientSnapshot(): boolean {
  return useCartStore.persist?.hasHydrated?.() ?? false;
}

function getServerSnapshot(): boolean {
  return false;
}
