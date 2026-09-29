"use client";

import { create } from "zustand";

import { errorMessage } from "@/lib/api/client";
import {
  addCartItem,
  getCart,
  removeCartItem,
  selectAllCartItems,
  updateCartItem,
  type AddCartItemInput,
} from "@/lib/api/cart";
import type { Cart, CartItem, CartSummary } from "@/types/cart";

import { useAuthStore } from "./auth-store";

/**
 * 장바구니 클라이언트 스토어.
 *
 * 장바구니는 서버(`/api/cart`)가 원본이다. 변경 API 가 변경 후의 장바구니 전체를 돌려주므로
 * 이 스토어는 응답을 통째로 교체하기만 한다(금액·배송비 계산도 서버 값 그대로).
 * 헤더 뱃지와 장바구니 화면이 같은 상태를 구독한다.
 *
 * 로그인이 필요하다. 로그아웃되면 비운다.
 */

type CartState = {
  items: CartItem[];
  summary: CartSummary;
  /** 배송비 정책(관리자 설정). 서버 응답에 함께 온다. */
  policy: Cart["shippingPolicy"] | null;
  /** 서버에서 한 번이라도 불러왔는지. 로딩 표시에 쓴다. */
  loaded: boolean;
  /** 장바구니 화면에서 마지막으로 실패한 요청의 안내 문구. */
  error: string | null;
  load: () => Promise<void>;
  addItem: (input: AddCartItemInput) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  toggleSelected: (id: string) => Promise<void>;
  toggleAllSelected: (selected: boolean) => Promise<void>;
  reset: () => void;
};

const EMPTY_SUMMARY: CartSummary = {
  itemCount: 0,
  selectedCount: 0,
  subtotal: 0,
  shippingFee: 0,
  total: 0,
  freeShippingRemainder: 0,
};

export const useCartStore = create<CartState>()((set, get) => {
  const apply = (cart: Cart) =>
    set({ items: cart.items, summary: cart.summary, policy: cart.shippingPolicy, loaded: true, error: null });

  return {
    items: [],
    summary: EMPTY_SUMMARY,
    policy: null,
    loaded: false,
    error: null,

    load: async () => apply(await getCart()),

    addItem: async (input) => apply(await addCartItem(input)),

    removeItem: async (id) => apply(await removeCartItem(id)),

    updateQuantity: async (id, quantity) =>
      apply(await updateCartItem(id, { quantity: Math.max(1, quantity) })),

    toggleSelected: async (id) => {
      const item = get().items.find((it) => it.id === id);
      if (!item) return;
      apply(await updateCartItem(id, { selected: !item.selected }));
    },

    toggleAllSelected: async (selected) => apply(await selectAllCartItems(selected)),

    reset: () => set({ items: [], summary: EMPTY_SUMMARY, policy: null, loaded: false, error: null }),
  };
});

// 로그아웃(또는 토큰 만료)되면 다른 회원의 장바구니가 남지 않도록 비운다.
useAuthStore.subscribe((state, prev) => {
  if (prev.accessToken && !state.accessToken) useCartStore.getState().reset();
});

/** 카트 요약 훅. 서버가 계산한 값을 그대로 쓴다. */
export function useCartSummary(): CartSummary {
  return useCartStore((s) => s.summary);
}

/**
 * 장바구니 화면의 버튼(수량·선택·삭제)용 실행기.
 * 실패하면 예외를 던지지 않고 `error` 에 문구를 남겨 화면이 안내하게 한다.
 */
export function runCartAction(action: () => Promise<void>): void {
  action().catch((error: unknown) => useCartStore.setState({ error: errorMessage(error) }));
}
