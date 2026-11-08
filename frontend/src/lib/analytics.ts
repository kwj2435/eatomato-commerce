import { apiUrl } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

/**
 * 방문자 분석 기록(관리자 > 방문자 분석). 페이지 조회(PageViewTracker)와 구매 단계 이벤트가 같은 ID 를 쓴다.
 *
 * - 방문자 ID: 브라우저마다 한 번 만든 임의 값(localStorage). 회원 정보·IP 와 묶지 않는다.
 * - 방문(세션) ID: 30분 동안 아무 기록이 없으면 새로 만든다. 탭끼리 공유한다.
 * - 캠페인: 링크에 붙은 ?from=값(예: 인스타 게시물 post-1107). 값이 지금 방문과 다르면 새 방문으로 시작한다
 *   (다른 게시물 링크를 눌러 들어온 것을 앞 방문에 섞지 않게. GA 와 같은 규칙).
 * - 관리자 화면과 관리자 계정은 보내지 않는다. 실패해도 화면에는 영향이 없게 조용히 버린다.
 */
const VISITOR_KEY = "eatomato-visitor";
const SESSION_KEY = "eatomato-visit";
const SESSION_IDLE_MS = 30 * 60 * 1000;

type SavedVisit = { id?: string; at?: number; campaign?: string | null };

export type Visit = { visitorId: string; sessionId: string; start: boolean; campaign: string | null };

/** 기록하지 않는 상황(관리자). */
function skip(): boolean {
  const path = window.location.pathname;
  if (path === "/admin" || path.startsWith("/admin/")) return true;
  return useAuthStore.getState().member?.role === "ADMIN";
}

/** 주소의 캠페인 값. ?from= 을 먼저 보고, 없으면 utm_campaign. 화면에서 다듬지 않고 서버가 정리한다. */
export function campaignFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const value = (params.get("from") ?? params.get("utm_campaign") ?? "").trim();
  return value ? value.slice(0, 200) : null;
}

/** 지금 방문을 이어 가거나 새로 시작한다. 저장소를 쓸 수 없으면 null. */
export function touchVisit(campaign: string | null = null): Visit | null {
  try {
    let visitorId = localStorage.getItem(VISITOR_KEY);
    if (!visitorId) {
      visitorId = uuid();
      localStorage.setItem(VISITOR_KEY, visitorId);
    }
    const now = Date.now();
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as SavedVisit | null;
    const fresh = Boolean(saved?.id) && typeof saved?.at === "number" && now - saved.at < SESSION_IDLE_MS;
    const newCampaign = campaign !== null && campaign !== (saved?.campaign ?? null);
    const ongoing = fresh && !newCampaign;
    const sessionId = ongoing ? (saved!.id as string) : uuid();
    const visitCampaign = ongoing ? (saved?.campaign ?? null) : campaign;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: sessionId, at: now, campaign: visitCampaign }));
    return { visitorId, sessionId, start: !ongoing, campaign: visitCampaign };
  } catch {
    return null;
  }
}

function send(path: string, body: Record<string, unknown>) {
  fetch(apiUrl(path), {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}

/** 페이지 조회 한 건. 유입 경로·캠페인은 방문의 첫 조회에만 보낸다. */
export function trackPageView(path: string) {
  if (skip()) return;
  const visit = touchVisit(campaignFromUrl());
  if (!visit) return;
  send("/api/analytics/pageview", {
    visitorId: visit.visitorId,
    sessionId: visit.sessionId,
    path,
    sessionStart: visit.start,
    referrer: visit.start && document.referrer ? document.referrer : null,
    campaign: visit.start ? visit.campaign : null,
  });
}

export type FunnelEvent =
  | { type: "ADD_TO_CART"; productId: string; quantity: number }
  | { type: "CHECKOUT_START"; orderNumber: string }
  | { type: "PURCHASE"; orderNumber: string };

/**
 * 구매 단계 이벤트. 결제 완료는 서버가 주문번호로 실제 결제됐는지 확인하고 금액도 주문에서 읽는다.
 * 같은 주문의 결제 완료는 서버가 한 번만 센다(완료 화면 새로고침).
 */
export function trackEvent(event: FunnelEvent) {
  if (typeof window === "undefined" || skip()) return;
  const visit = touchVisit();
  if (!visit) return;
  const productId = "productId" in event ? Number(event.productId) : undefined;
  if (productId !== undefined && !Number.isSafeInteger(productId)) return;
  send("/api/analytics/event", {
    visitorId: visit.visitorId,
    sessionId: visit.sessionId,
    type: event.type,
    productId,
    quantity: "quantity" in event ? event.quantity : undefined,
    orderNumber: "orderNumber" in event ? event.orderNumber : undefined,
  });
}

/** crypto.randomUUID 는 HTTPS·localhost 에서만 있다. 없으면 같은 형식으로 만든다(서버가 UUID 형식을 검사한다). */
function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
