"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

import { INITIAL_CART_ITEMS } from "@/lib/mock/cart";
import type { CartItem } from "@/types/cart";
import { SHIPPING_POLICY } from "@/types/cart";

/**
 * 장바구니 클라이언트 스토어.
 *
 * 선택 기준:
 * - 카트 상태는 페이지 이동에도 유지되어야 하고(전역), 헤더의 카운트 뱃지 등 여러 곳에서 구독한다.
 * - 로그인·서버 세션이 아직 없어 localStorage 로 영속화한다.
 * - React Context 로도 가능하지만 Zustand 는 provider 를 두르지 않아도 되고, 렌더 최적화가 쉽다.
 *
 * SSR 대응:
 * - Next.js 는 서버에서 이 파일을 실행하지 않도록 "use client" 를 붙여 브라우저에서만 초기화한다.
 * - persist 미들웨어가 하이드레이션 완료 시점을 이벤트로 알려 준다 → hydration mismatch 방지 위해
 *   화면에서 소비할 때 `useHasHydrated()` 훅으로 마운트 이후에만 렌더한다.
 */

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleSelected: (id: string) => void;
  toggleAllSelected: (selected: boolean) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: INITIAL_CART_ITEMS,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((it) => it.id === item.id);
          if (existing) {
            return {
              items: state.items.map((it) =>
                it.id === item.id
                  ? { ...it, quantity: it.quantity + item.quantity }
                  : it,
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((it) => it.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((it) =>
            it.id === id ? { ...it, quantity: Math.max(1, quantity) } : it,
          ),
        })),

      toggleSelected: (id) =>
        set((state) => ({
          items: state.items.map((it) =>
            it.id === id ? { ...it, selected: !it.selected } : it,
          ),
        })),

      toggleAllSelected: (selected) =>
        set((state) => ({
          items: state.items.map((it) => ({ ...it, selected })),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: "eatomato-cart",
      /** 재시작 시 items 만 복원한다. 액션은 매번 새로 만든다. */
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

// ────────────────────────────────────────────────────────────────
// 파생 값 selector
//
// 컴포넌트가 `useCartStore((s) => derive(s.items))` 로 직접 계산하면 매번 새 객체를 반환해
// 참조 비교로 리렌더가 유발된다. `useShallow` + selector 로 얕은 비교하도록 만들어
// 불필요한 리렌더를 막는다.
// ────────────────────────────────────────────────────────────────

export type CartSummary = {
  itemCount: number;
  selectedCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  freeShippingRemainder: number;
};

function computeSummary(items: CartItem[]): CartSummary {
  const selectedItems = items.filter((it) => it.selected);
  const subtotal = selectedItems.reduce(
    (sum, it) => sum + it.unitPrice * it.quantity,
    0,
  );
  const shippingFee =
    subtotal === 0 || subtotal >= SHIPPING_POLICY.freeThreshold
      ? 0
      : SHIPPING_POLICY.standardFee;
  const freeShippingRemainder = Math.max(
    0,
    SHIPPING_POLICY.freeThreshold - subtotal,
  );
  return {
    itemCount: items.length,
    selectedCount: selectedItems.length,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    freeShippingRemainder,
  };
}

/** 카트 요약 훅. 파생값이 바뀌지 않으면 재렌더하지 않는다. */
export function useCartSummary(): CartSummary {
  return useCartStore(useShallow((s) => computeSummary(s.items)));
}
