"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { apiUrl } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

/**
 * 스토어 페이지 조회를 백엔드에 남긴다(관리자 > 방문자 분석).
 *
 * - 방문자 ID: 브라우저마다 한 번 만든 임의 값(localStorage). 회원 정보·IP 와 묶지 않는다.
 * - 방문(세션) ID: 30분 동안 조회가 없으면 새로 만든다. 탭끼리 공유한다.
 * - 유입 경로(document.referrer)는 방문의 첫 조회에만 보낸다. 화면 이동(클라이언트 라우팅)에서는 값이 바뀌지 않기 때문이다.
 * - 관리자 화면과 관리자 계정의 조회는 보내지 않는다(운영자가 둘러본 것이 통계에 섞이지 않게).
 * - 실패해도 화면에는 아무 영향이 없게 조용히 버린다.
 */
const VISITOR_KEY = "eatomato-visitor";
const SESSION_KEY = "eatomato-visit";
const SESSION_IDLE_MS = 30 * 60 * 1000;

export function PageViewTracker() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    // 개발 모드(StrictMode)에서 effect 가 두 번 돌아도 한 번만 보낸다.
    if (lastSent.current === path) return;
    lastSent.current = path;

    if (path === "/admin" || path.startsWith("/admin/")) return;
    if (useAuthStore.getState().member?.role === "ADMIN") return;

    const visitorId = visitor();
    const visit = nextVisit();
    if (!visitorId || !visit) return;

    fetch(apiUrl("/api/analytics/pageview"), {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId,
        sessionId: visit.id,
        path,
        sessionStart: visit.start,
        referrer: visit.start && document.referrer ? document.referrer : null,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}

function visitor(): string | null {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** 지금 방문의 ID. 마지막 조회에서 30분이 지났으면 새 방문을 시작한다. */
function nextVisit(): { id: string; start: boolean } | null {
  try {
    const now = Date.now();
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as { id?: string; at?: number } | null;
    const ongoing = saved?.id && typeof saved.at === "number" && now - saved.at < SESSION_IDLE_MS;
    const id = ongoing ? (saved.id as string) : uuid();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id, at: now }));
    return { id, start: !ongoing };
  } catch {
    return null;
  }
}

/** crypto.randomUUID 는 HTTPS·localhost 에서만 있다. 없으면 같은 형식으로 만든다(서버가 UUID 형식을 검사한다). */
function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
