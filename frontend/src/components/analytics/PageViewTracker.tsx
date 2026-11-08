"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { trackPageView } from "@/lib/analytics";

/**
 * 스토어 페이지 조회를 백엔드에 남긴다(관리자 > 방문자 분석). 방문자·방문 ID, 캠페인(?from=) 규칙은 lib/analytics.ts.
 * 유입 경로(document.referrer)는 방문의 첫 조회에만 보낸다. 화면 이동(클라이언트 라우팅)에서는 값이 바뀌지 않기 때문이다.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    // 개발 모드(StrictMode)에서 effect 가 두 번 돌아도 한 번만 보낸다.
    if (lastSent.current === path) return;
    lastSent.current = path;
    trackPageView(path);
  }, [pathname]);

  return null;
}
