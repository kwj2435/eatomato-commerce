import type { Order, OrderShipping } from "@/types/order";

import { apiFetch } from "./client";

/**
 * 주문서 제출 → 결제대기 주문. 이어서 결제(PG)를 거쳐 confirmPayment 로 결제완료가 된다.
 * cartItemIds 를 비우면 장바구니에서 선택된 항목 전체를 주문한다.
 * 쿠폰(1장)·적립금은 주문을 만들 때 바로 차감되고, 주문이 취소되면 돌려받는다.
 * 쿠폰·적립금으로 결제할 금액이 0원이면 결제창 없이 결제완료(PAID)로 돌아온다.
 */
export async function createOrder(
  shipping: OrderShipping,
  options: { cartItemIds?: string[]; memberCouponId?: string; usePoints?: number } = {},
): Promise<Order> {
  return apiFetch<Order>("/api/orders", {
    method: "POST",
    auth: true,
    json: {
      shipping,
      cartItemIds: options.cartItemIds?.map(Number),
      memberCouponId: options.memberCouponId ? Number(options.memberCouponId) : undefined,
      usePoints: options.usePoints || undefined,
    },
  });
}

/** 주문서가 띄울 결제창. TOSS 면 결제위젯 클라이언트 키(공개 키)가 함께 온다. MOCK 은 결제창 없이 승인된다. */
export type PaymentConfig = { provider: "TOSS" | "MOCK"; clientKey: string | null };

export async function getPaymentConfig(): Promise<PaymentConfig> {
  return apiFetch<PaymentConfig>("/api/payments/config", { auth: true });
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
