"use client";

import Image from "next/image";
import Link from "next/link";

import { Checkbox } from "@/components/ui/Checkbox";
import { CloseIcon } from "@/components/ui/icons";
import { runCartAction, useCartStore } from "@/lib/store/cart-store";
import { formatKRW } from "@/lib/utils/format";
import type { CartItem } from "@/types/cart";

import { QuantityStepper } from "./QuantityStepper";

type CartItemListProps = {
  items: CartItem[];
};

/**
 * 장바구니 상품 목록.
 *
 * 예전에는 데스크톱에서 4열 표(상품 정보 / 수량 / 가격 / 배송비), 모바일에서 카드 목록으로 따로 그렸다.
 * 배송비는 오른쪽 결제 요약(CartSummary)에 한 번만 보이면 되므로 열을 없애고,
 * 데스크톱·모바일이 같은 카드 목록을 쓴다(데스크톱은 CartView 가 목록 옆에 요약을 둔다).
 */
export function CartItemList({ items }: CartItemListProps) {
  const toggleAll = useCartStore((s) => s.toggleAllSelected);
  const removeSelected = useCartStore((s) => s.removeSelected);
  const selectedCount = items.filter((it) => it.selected).length;
  const allSelected = items.length > 0 && selectedCount === items.length;

  return (
    <div>
      <div className="flex items-center justify-between border-b-[1.5px] border-ink-primary pb-3.5">
        <span className="flex items-center gap-2.5 text-[14px] font-medium tracking-[-0.2px] text-ink-primary">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(next) => runCartAction(() => toggleAll(next))}
            label="전체 선택"
          />
          전체 선택 ({selectedCount}/{items.length})
        </span>
        <button
          type="button"
          onClick={() => runCartAction(removeSelected)}
          disabled={selectedCount === 0}
          className="border border-[#D9CFCC] bg-surface-elevated px-2.5 py-1.5 text-[13px] tracking-[-0.2px] text-ink-muted transition-colors hover:border-ink-primary hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#D9CFCC] disabled:hover:text-ink-muted"
        >
          선택 삭제
        </button>
      </div>

      <ul>
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </ul>

      <Link
        href="/products/phone-case"
        className="mt-[18px] inline-flex items-center gap-1.5 text-[13px] tracking-[-0.2px] text-ink-muted transition-colors hover:text-ink-primary"
      >
        <span aria-hidden>←</span> 쇼핑 계속하기
      </Link>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────

/** 품절·재고 부족 안내. 이런 항목이 선택돼 있으면 주문서로 넘어갈 수 없다. */
function UnavailableNote({ item }: { item: CartItem }) {
  if (item.available) return null;
  const text =
    item.stock === 0
      ? "품절된 상품입니다"
      : item.stock !== undefined
        ? `재고 부족 (남은 수량 ${item.stock}개)`
        : "판매가 중지된 상품입니다";
  return <span className="mt-1.5 block text-[12.5px] font-medium text-brand-primary">{text}</span>;
}

function CartItemRow({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const toggleSelected = useCartStore((s) => s.toggleSelected);

  const lineTotal = item.unitPrice * item.quantity;
  const hasDiscount = item.listPrice !== undefined && item.listPrice > item.unitPrice;
  const discountRate = hasDiscount ? Math.round((1 - item.unitPrice / item.listPrice!) * 100) : 0;
  const href = `/products/${item.slug}`;

  return (
    <li className="relative grid grid-cols-[18px_88px_minmax(0,1fr)] gap-3.5 border-b border-[#F0E2DE] py-[22px]">
      <span className="pt-0.5">
        <Checkbox
          checked={item.selected}
          onCheckedChange={() => runCartAction(() => toggleSelected(item.id))}
          label={`${item.name} 선택`}
        />
      </span>

      <Link href={href} className="flex h-[110px] w-[88px] items-center justify-center overflow-hidden bg-black/[0.03]">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} width={88} height={110} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[11px] tracking-[-0.2px] text-[#B3A79C]">상품이미지</span>
        )}
      </Link>

      <div className="flex min-w-0 flex-col">
        <Link
          href={href}
          className="break-keep pr-7 text-[15px] font-semibold leading-5 tracking-[-0.2px] text-ink-primary hover:underline underline-offset-2"
        >
          {item.name}
        </Link>
        {item.option ? (
          <p className="mt-1.5 break-keep text-[13px] leading-[18px] tracking-[-0.2px] text-ink-subtle">{item.option}</p>
        ) : null}
        <UnavailableNote item={item} />

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-2 pt-3.5">
          <QuantityStepper
            size="sm"
            value={item.quantity}
            onChange={(next) => runCartAction(() => updateQuantity(item.id, next))}
            label={`${item.name} 수량`}
          />
          {/* 좁은 화면에서 스테퍼 아래로 줄바꿈돼도 가격은 오른쪽에 둔다. */}
          <p className="ml-auto text-right tracking-[-0.2px]">
            {hasDiscount ? (
              <del className="block text-[12px] text-ink-subtle">{formatKRW(item.listPrice! * item.quantity)}</del>
            ) : null}
            {hasDiscount ? (
              <span className="mr-1 text-[14px] font-bold text-brand-primary">{discountRate}%</span>
            ) : null}
            <span className="text-[16px] font-bold text-ink-primary">{formatKRW(lineTotal)}</span>
          </p>
        </div>
      </div>

      <button
        type="button"
        aria-label={`${item.name} 삭제`}
        onClick={() => runCartAction(() => removeItem(item.id))}
        className="absolute right-0 top-5 flex h-6 w-6 items-center justify-center text-ink-subtle transition-colors hover:text-ink-primary"
      >
        <CloseIcon width={12} height={12} />
      </button>
    </li>
  );
}
