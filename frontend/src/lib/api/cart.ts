import type { Cart } from "@/types/cart";

import { apiFetch } from "./client";

/** 장바구니 API. 변경 요청은 모두 변경 후의 장바구니 전체를 돌려준다. */

export async function getCart(): Promise<Cart> {
  return apiFetch<Cart>("/api/cart", { auth: true });
}

export type AddCartItemInput = {
  productId: string;
  /** 옵션 그룹 id → 선택지 id */
  options: Record<string, string>;
  quantity: number;
};

export async function addCartItem(input: AddCartItemInput): Promise<Cart> {
  return apiFetch<Cart>("/api/cart/items", {
    method: "POST",
    auth: true,
    json: { ...input, productId: Number(input.productId) },
  });
}

export async function updateCartItem(
  id: string,
  patch: { quantity?: number; selected?: boolean },
): Promise<Cart> {
  return apiFetch<Cart>(`/api/cart/items/${id}`, { method: "PATCH", auth: true, json: patch });
}

export async function selectAllCartItems(selected: boolean): Promise<Cart> {
  return apiFetch<Cart>("/api/cart/selection", { method: "PUT", auth: true, json: { selected } });
}

export async function removeCartItem(id: string): Promise<Cart> {
  return apiFetch<Cart>(`/api/cart/items/${id}`, { method: "DELETE", auth: true });
}
