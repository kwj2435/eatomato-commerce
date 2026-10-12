/**
 * 비회원 장바구니·결제 진행 정보를 브라우저에 보관한다.
 *
 * - 장바구니(localStorage): 탭·새로고침이 지나도 남는다. 로그인하면 회원 장바구니로 옮기고 비운다.
 * - 결제 진행(sessionStorage): 토스 결제창에서 돌아온 완료·실패 화면이 결제 승인·취소에 쓸 주문 비밀번호와
 *   주문한 장바구니 줄 id. 탭을 닫으면 사라진다.
 *
 * 저장소를 쓸 수 없는 환경(사파리 비공개 모드 등)에서는 조용히 빈 값으로 동작한다.
 */
import type { GuestCartLine } from "@/lib/api/guest";

const CART_KEY = "eatomato-guest-cart";
const CHECKOUT_KEY = "eatomato-guest-checkout";

export function readGuestCart(): GuestCartLine[] {
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as GuestCartLine[]) : [];
  } catch {
    return [];
  }
}

export function writeGuestCart(lines: GuestCartLine[]): void {
  try {
    if (lines.length) window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
    else window.localStorage.removeItem(CART_KEY);
  } catch {
    // 저장소를 못 쓰면 이 화면에서만 유지된다.
  }
}

/** 결제창으로 넘어가기 전 저장. 완료·실패 화면에서 같은 주문번호로 꺼낸다. */
export type GuestCheckout = { orderNumber: string; password: string; lineIds: string[] };

export function saveGuestCheckout(checkout: GuestCheckout): void {
  try {
    window.sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(checkout));
  } catch {
    // 저장하지 못하면 완료 화면에서 주문 조회로 안내한다.
  }
}

export function readGuestCheckout(orderNumber: string): GuestCheckout | null {
  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_KEY);
    const parsed = raw ? (JSON.parse(raw) as GuestCheckout) : null;
    return parsed?.orderNumber === orderNumber ? parsed : null;
  } catch {
    return null;
  }
}

export function clearGuestCheckout(): void {
  try {
    window.sessionStorage.removeItem(CHECKOUT_KEY);
  } catch {
    // 무시
  }
}
