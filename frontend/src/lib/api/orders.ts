import type { Order, OrderShipping } from "@/types/order";

import { apiFetch } from "./client";

/**
 * 주문서 제출 → 결제대기 주문. 이어서 결제(PG)를 거쳐 confirmPayment 로 결제완료가 된다.
 * cartItemIds 를 비우면 장바구니에서 선택된 항목 전체를 주문한다.
 */
export async function createOrder(shipping: OrderShipping, cartItemIds?: string[]): Promise<Order> {
  return apiFetch<Order>("/api/orders", {
    method: "POST",
    auth: true,
    json: { shipping, cartItemIds: cartItemIds?.map(Number) },
  });
}

/** 결제 승인. PG 결제창이 돌려준 값(paymentKey·주문번호·금액)을 그대로 보낸다. */
export async function confirmPayment(orderNumber: string, paymentKey: string, amount: number): Promise<Order> {
  return apiFetch<Order>("/api/payments/confirm", {
    method: "POST",
    auth: true,
    json: { orderNumber, paymentKey, amount },
  });
}

export async function listMyOrders(): Promise<Order[]> {
  return apiFetch<Order[]>("/api/orders", { auth: true });
}

export async function getMyOrder(orderNumber: string): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${orderNumber}`, { auth: true });
}

/** 고객 취소(결제대기·결제완료만). 결제완료였다면 결제가 취소(환불)된다. */
export async function cancelMyOrder(orderNumber: string): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${orderNumber}/cancel`, { method: "POST", auth: true });
}
