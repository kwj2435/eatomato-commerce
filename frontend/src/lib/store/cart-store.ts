"use client";

import { create } from "zustand";

import { ApiError, errorMessage } from "@/lib/api/client";
import {
  addCartItem,
  getCart,
  removeCartItem,
  selectAllCartItems,
  updateCartItem,
  type AddCartItemInput,
} from "@/lib/api/cart";
import { quoteGuestCart, type GuestCartLine } from "@/lib/api/guest";
import type { Cart, CartItem, CartSummary } from "@/types/cart";

import { hasSession, useAuthStore } from "./auth-store";
import { readGuestCart, writeGuestCart } from "./guest-checkout";

/**
 * 장바구니 클라이언트 스토어.
 *
 * 장바구니는 서버(`/api/cart`)가 원본이다. 변경 API 가 변경 후의 장바구니 전체를 돌려주므로
 * 이 스토어는 응답을 통째로 교체하기만 한다(금액·배송비 계산도 서버 값 그대로).
 * 헤더 뱃지와 장바구니 화면이 같은 상태를 구독한다.
 *
 * 비로그인(비회원)이면 장바구니 줄을 브라우저(localStorage)에 두고, 금액·재고는 `/api/guest/cart` 로 서버가 계산한다.
 * 화면은 두 경우를 구분하지 않고 같은 상태를 쓴다. 로그인하면 비회원 장바구니를 회원 장바구니로 옮긴다.
 * 로그아웃되면 비운다.
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

  /** 비회원 장바구니를 서버 금액으로 계산해 반영한다. 응답에서 빠진 줄(삭제된 상품 등)은 브라우저에서도 지운다. */
  const applyGuest = async (lines: GuestCartLine[]) => {
    if (lines.length === 0) {
      writeGuestCart([]);
      set({ items: [], summary: EMPTY_SUMMARY, loaded: true, error: null });
      return;
    }
    const cart = await quoteGuestCart(lines);
    const kept = new Set(cart.items.map((it) => it.id));
    writeGuestCart(lines.filter((line) => kept.has(line.id)));
    apply(cart);
  };

  /** 비회원 장바구니 줄을 바꾼다. 서버 계산이 실패하면 브라우저 값도 되돌린다. */
  const updateGuest = async (change: (lines: GuestCartLine[]) => GuestCartLine[]) => {
    const before = readGuestCart();
    try {
      await applyGuest(change(before));
    } catch (error) {
      writeGuestCart(before);
      throw error;
    }
  };

  return {
    items: [],
    summary: EMPTY_SUMMARY,
    policy: null,
    loaded: false,
    error: null,

    load: async () => (hasSession() ? apply(await getCart()) : applyGuest(readGuestCart())),

    addItem: async (input) => {
      if (hasSession()) return apply(await addCartItem(input));
      const before = readGuestCart();
      const same = before.find((line) => line.productId === input.productId && sameOptions(line.options, input.options));
      const id = same?.id ?? newLineId();
      const lines = same
        ? before.map((line) =>
            line.id === id ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + input.quantity) } : line,
          )
        : [...before, { id, productId: input.productId, options: input.options, quantity: input.quantity, selected: true }];
      const cart = await quoteGuestCart(lines);
      // 회원 장바구니 담기와 같은 규칙: 옵션이 맞지 않거나 재고보다 많이 담으면 담지 않는다.
      const added = cart.items.find((it) => it.id === id);
      if (!added) throw new ApiError(400, "INVALID_OPTION", "상품 옵션을 모두 올바르게 선택해 주세요.");
      if (!added.available) {
        throw new ApiError(
          409,
          "INSUFFICIENT_STOCK",
          added.stock !== undefined && added.stock > 0
            ? `재고가 부족합니다. 지금 살 수 있는 수량은 ${added.stock}개입니다.`
            : "품절된 상품입니다.",
        );
      }
      await applyGuest(lines);
    },

    removeItem: async (id) =>
      hasSession()
        ? apply(await removeCartItem(id))
        : updateGuest((lines) => lines.filter((line) => line.id !== id)),

    updateQuantity: async (id, quantity) => {
      const next = Math.min(MAX_QUANTITY, Math.max(1, quantity));
      if (hasSession()) return apply(await updateCartItem(id, { quantity: next }));
      return updateGuest((lines) => lines.map((line) => (line.id === id ? { ...line, quantity: next } : line)));
    },

    toggleSelected: async (id) => {
      const item = get().items.find((it) => it.id === id);
      if (!item) return;
      if (hasSession()) return apply(await updateCartItem(id, { selected: !item.selected }));
      return updateGuest((lines) => lines.map((line) => (line.id === id ? { ...line, selected: !item.selected } : line)));
    },

    toggleAllSelected: async (selected) =>
      hasSession()
        ? apply(await selectAllCartItems(selected))
        : updateGuest((lines) => lines.map((line) => ({ ...line, selected }))),

    reset: () => set({ items: [], summary: EMPTY_SUMMARY, policy: null, loaded: false, error: null }),
  };
});

const MAX_QUANTITY = 99;

function sameOptions(a: Record<string, string>, b: Record<string, string>): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

function newLineId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 비회원 결제가 끝난 줄을 장바구니에서 지운다(회원은 서버가 지운다). */
export async function removeGuestCartLines(ids: string[]): Promise<void> {
  const remove = new Set(ids);
  writeGuestCart(readGuestCart().filter((line) => !remove.has(line.id)));
  await useCartStore.getState().load();
}

/**
 * 로그인하면 비회원 장바구니를 회원 장바구니로 옮긴다. 담을 수 없는 줄(품절 등)은 건너뛴다.
 * 여러 번 옮겨지지 않도록 먼저 비운다.
 */
async function moveGuestCartToMember() {
  const lines = readGuestCart();
  if (lines.length === 0) return;
  writeGuestCart([]);
  for (const line of lines) {
    await addCartItem({ productId: line.productId, options: line.options, quantity: line.quantity }).catch(() => {});
  }
  await useCartStore.getState().load().catch(() => {});
}

// 로그인하면 비회원 장바구니 화면 상태를 비우고(회원 장바구니를 다시 불러오게) 비회원 줄을 옮긴다.
useAuthStore.subscribe((state, prev) => {
  if (prev.accessToken || !state.accessToken) return;
  useCartStore.getState().reset();
  void moveGuestCartToMember();
});

// 로그아웃(또는 토큰 만료)되면 다른 회원의 장바구니가 남지 않도록 비운다(다음 load 는 비회원 장바구니).
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
