import type { Cart } from "@/types/cart";
import type { Order, OrderShipping } from "@/types/order";

import { apiFetch } from "./client";

/**
 * 비회원(로그인 없이) 장바구니·주문 API.
 * 비회원 장바구니는 브라우저(localStorage)에 두고 금액·재고는 서버가 계산한다.
 * 주문 조회·취소·결제 승인은 주문번호 + 주문 비밀번호로 확인한다.
 */

/** 브라우저에 보관하는 비회원 장바구니 한 줄. */
export type GuestCartLine = {
  id: string;
  productId: string;
  /** 옵션 그룹 id → 선택지 id */
  options: Record<string, string>;
  quantity: number;
  selected: boolean;
};

const toBody = (line: GuestCartLine) => ({ ...line, productId: Number(line.productId) });

/** 응답의 items[].id 는 보낸 줄 id 그대로다. 사라졌거나 옵션이 바뀐 상품 줄은 빠져서 온다. */
export async function quoteGuestCart(lines: GuestCartLine[]): Promise<Cart> {
  return apiFetch<Cart>("/api/guest/cart", { method: "POST", json: { items: lines.map(toBody) } });
}

export type GuestOrderer = { name: string; phone: string; email: string };

export async function createGuestOrder(input: {
  lines: GuestCartLine[];
  shipping: OrderShipping;
  orderer: GuestOrderer;
  password: string;
  agreePrivacy: boolean;
}): Promise<Order> {
  const { lines, ...rest } = input;
  return apiFetch<Order>("/api/guest/orders", { method: "POST", json: { ...rest, items: lines.map(toBody) } });
}

export async function lookupGuestOrder(orderNumber: string, password: string): Promise<Order> {
  return apiFetch<Order>("/api/guest/orders/lookup", { method: "POST", json: { orderNumber, password } });
}

export async function cancelGuestOrder(orderNumber: string, password: string): Promise<Order> {
  return apiFetch<Order>("/api/guest/orders/cancel", { method: "POST", json: { orderNumber, password } });
}

export async function confirmGuestPayment(
  orderNumber: string,
  password: string,
  paymentKey: string,
  amount: number,
): Promise<Order> {
  return apiFetch<Order>("/api/guest/orders/confirm", {
    method: "POST",
    json: { orderNumber, password, paymentKey, amount },
  });
}
