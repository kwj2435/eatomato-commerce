import type { Order } from "@/types/order";

import { apiFetch } from "./client";

/** 장바구니에서 선택된 항목으로 주문한다. (결제 연동 전이라 서버가 바로 결제 완료로 기록한다) */
export async function createOrder(): Promise<Order> {
  return apiFetch<Order>("/api/orders", { method: "POST", auth: true });
}

export async function listMyOrders(): Promise<Order[]> {
  return apiFetch<Order[]>("/api/orders", { auth: true });
}
