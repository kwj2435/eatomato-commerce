"use client";

import Image from "next/image";

import { Checkbox } from "@/components/ui/Checkbox";
import { InfoIcon } from "@/components/ui/icons";
import { useCartStore } from "@/lib/store/cart-store";
import { formatKRW } from "@/lib/utils/format";
import type { CartItem } from "@/types/cart";
import { SHIPPING_POLICY } from "@/types/cart";

import { QuantityStepper } from "./QuantityStepper";

type CartTableProps = {
  items: CartItem[];
};

/**
 * 장바구니 상품 테이블.
 *
 * 시안이 `table` 을 기반으로 rowspan(배송비 셀)을 쓰므로 여기서도 `<table>` 을 유지한다.
 * 시맨틱 관점에서도 컬럼 헤더와 데이터 셀의 관계가 명확해 스크린리더 친화적이다.
 *
 * 열 폭은 시안 실측(604/123/221/252) 을 그대로 사용해 콘텐츠가 흔들리지 않도록 고정한다.
 */
export function CartTable({ items }: CartTableProps) {
  const allSelected = items.length > 0 && items.every((it) => it.selected);
  const toggleAll = useCartStore((s) => s.toggleAllSelected);

  return (
    <table className="mt-[46px] w-full table-fixed border-collapse">
      <colgroup>
        <col className="w-[604px]" />
        <col className="w-[123px]" />
        <col className="w-[221px]" />
        <col className="w-[252px]" />
      </colgroup>
      <thead>
        <tr>
          <th
            scope="col"
            className="h-14 border-b-[1.5px] border-black text-left text-[15px] font-normal tracking-[-0.2px]"
          >
            <span className="mr-3 inline-flex align-middle">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(next) => toggleAll(next)}
                label="전체 선택"
              />
            </span>
            상품 정보
          </th>
          <th
            scope="col"
            className="h-14 border-b-[1.5px] border-black text-center text-[15px] font-normal tracking-[-0.2px]"
          >
            수량
          </th>
          <th
            scope="col"
            className="h-14 border-b-[1.5px] border-black text-center text-[15px] font-normal tracking-[-0.2px]"
          >
            가격
          </th>
          <th
            scope="col"
            className="h-14 border-b-[1.5px] border-black text-center text-[15px] font-normal tracking-[-0.2px]"
          >
            배송비
          </th>
        </tr>
      </thead>
      <tbody className="border-b-[1.5px] border-black">
        {items.map((item, index) => (
          <CartItemRow
            key={item.id}
            item={item}
            isLast={index === items.length - 1}
            showShipCell={index === 0}
            shipRowSpan={items.length}
          />
        ))}
      </tbody>
    </table>
  );
}

// ────────────────────────────────────────────────────────────────

type CartItemRowProps = {
  item: CartItem;
  isLast: boolean;
  showShipCell: boolean;
  shipRowSpan: number;
};

function CartItemRow({ item, isLast, showShipCell, shipRowSpan }: CartItemRowProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const toggleSelected = useCartStore((s) => s.toggleSelected);

  /**
   * 배송비 셀을 제외한 3개 셀에만 하단 구분선을 두는 시안 규칙.
   * 마지막 행에서는 구분선을 걷어 낸다(테이블 바깥의 굵은 선이 대체).
   */
  const cellBorder = isLast ? "" : "border-b-[1.5px] border-black";
  const cellBase = "py-[21px] align-middle text-[15px] font-normal";

  return (
    <tr>
      <td className={`${cellBase} text-left ${cellBorder}`}>
        <div className="flex items-center">
          <span className="mr-[11px]">
            <Checkbox
              checked={item.selected}
              onCheckedChange={() => toggleSelected(item.id)}
              label={`${item.name} 선택`}
            />
          </span>
          <span className="mr-[27px] flex h-[100px] w-20 flex-none items-center justify-center overflow-hidden bg-white">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={80}
                height={100}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[11px] tracking-[-0.2px] text-[#B3A79C]">
                상품이미지
              </span>
            )}
          </span>
          <span className="flex flex-col items-start text-left">
            <span className="text-[15px] font-medium leading-[15px] tracking-[-0.2px]">
              {item.name}
            </span>
            {item.option ? (
              <span className="mt-[11px] text-[14px] font-normal leading-[14px] tracking-[-0.2px]">
                {item.option}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="mt-[18px] text-[14px] font-normal leading-[13px] tracking-[-0.2px] underline-offset-2 hover:underline"
            >
              삭제하기
            </button>
          </span>
        </div>
      </td>

      <td className={`${cellBase} text-center ${cellBorder}`}>
        <QuantityStepper
          value={item.quantity}
          onChange={(next) => updateQuantity(item.id, next)}
          label={`${item.name} 수량`}
        />
      </td>

      <td className={`${cellBase} text-center ${cellBorder}`}>
        {formatKRW(item.unitPrice * item.quantity)}
      </td>

      {/*
       * 배송비 셀은 첫 행에서만 rowspan 으로 렌더한다.
       * (렌더링되지 않는 셀은 br 스킵 — 다른 행에서는 <td> 자체가 존재하지 않는다)
       */}
      {showShipCell ? (
        <td className={`${cellBase} text-center align-middle`} rowSpan={shipRowSpan}>
          <span className="flex items-center justify-center gap-1 text-[15px] font-normal">
            무료
            <InfoIcon className="text-black" />
          </span>
          <p className="mt-2 text-[15px] font-normal leading-[19px] tracking-[-0.2px]">
            {formatKRW(SHIPPING_POLICY.freeThreshold)} 이상 구매 시 무료
            <br />
            (배송비 {formatKRW(SHIPPING_POLICY.standardFee)})
          </p>
        </td>
      ) : null}
    </tr>
  );
}
