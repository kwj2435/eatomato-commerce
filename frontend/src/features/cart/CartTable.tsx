"use client";

import Image from "next/image";

import { Checkbox } from "@/components/ui/Checkbox";
import { InfoIcon } from "@/components/ui/icons";
import { runCartAction, useCartStore } from "@/lib/store/cart-store";
import { formatKRW } from "@/lib/utils/format";
import type { CartItem } from "@/types/cart";

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
 * 열 폭은 시안 실측(604/123/221/252, 합 1200px)의 비율로 둔다. px 로 고정하면
 * 컨테이너가 1200px 보다 좁을 때 표가 화면 밖으로 밀려났다.
 *
 * md(768) 미만에선 4열 표가 들어갈 폭이 없어 카드형 목록(`CartMobileList`)으로 바꿔 보여준다.
 */
export function CartTable({ items }: CartTableProps) {
  const policy = useCartStore((s) => s.policy);
  const allSelected = items.length > 0 && items.every((it) => it.selected);
  const toggleAll = useCartStore((s) => s.toggleAllSelected);

  return (
    <>
      <CartMobileList
        items={items}
        allSelected={allSelected}
        onToggleAll={toggleAll}
        policyText={policyText(policy)}
      />
      <table className="mt-[46px] hidden w-full table-fixed border-collapse md:table">
        <colgroup>
          <col className="w-[50.3%]" />
          <col className="w-[10.3%]" />
          <col className="w-[18.4%]" />
          <col className="w-[21%]" />
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
                  onCheckedChange={(next) => runCartAction(() => toggleAll(next))}
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
              policy={policy}
            />
          ))}
        </tbody>
      </table>
    </>
  );
}

// ────────────────────────────────────────────────────────────────

type CartMobileListProps = {
  items: CartItem[];
  allSelected: boolean;
  onToggleAll: (next: boolean) => Promise<void>;
  policyText: string;
};

type Policy = ReturnType<typeof useCartStore.getState>["policy"];

/** 배송비 안내 문구. 관리자가 정한 배송비 정책으로 만든다. */
function policyText(policy: Policy): string {
  if (!policy) return "";
  if (policy.freeThreshold <= 0) return "전 상품 무료배송";
  return `배송비 ${formatKRW(policy.standardFee)} · ${formatKRW(policy.freeThreshold)} 이상 구매 시 무료`;
}

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

/**
 * 모바일 장바구니 목록.
 * 표의 열(상품 정보 / 수량 / 가격)을 한 카드 안에 세로로 쌓고,
 * 표에서 rowspan 으로 한 번만 보이던 배송비 안내는 목록 하단에 한 번만 둔다.
 */
function CartMobileList({ items, allSelected, onToggleAll, policyText }: CartMobileListProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const toggleSelected = useCartStore((s) => s.toggleSelected);

  return (
    <div className="mt-8 md:hidden">
      <div className="flex h-12 items-center gap-3 border-b-[1.5px] border-black text-[15px] tracking-[-0.2px]">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(next) => runCartAction(() => onToggleAll(next))}
          label="전체 선택"
        />
        상품 정보
      </div>

      <ul>
        {items.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 border-b-[1.5px] border-black py-5"
          >
            <span className="pt-0.5">
              <Checkbox
                checked={item.selected}
                onCheckedChange={() => runCartAction(() => toggleSelected(item.id))}
                label={`${item.name} 선택`}
              />
            </span>
            <span className="flex h-[100px] w-20 flex-none items-center justify-center overflow-hidden bg-white">
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

            <div className="flex min-w-0 flex-1 flex-col">
              <p className="break-keep text-[14px] font-medium leading-5 tracking-[-0.2px]">
                {item.name}
              </p>
              {item.option ? (
                <p className="mt-1 break-keep text-[12.5px] leading-[18px] tracking-[-0.2px] text-[#545454]">
                  {item.option}
                </p>
              ) : null}
              <UnavailableNote item={item} />

              <div className="mt-3 flex items-center justify-between gap-2">
                {/* 스테퍼 자체의 mx-auto 가 가격 쪽 여백을 먹지 않도록 콘텐츠 폭 래퍼로 감싼다. */}
                <div>
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(next) => runCartAction(() => updateQuantity(item.id, next))}
                    label={`${item.name} 수량`}
                  />
                </div>
                <span className="text-[14px] font-medium tracking-[-0.2px]">
                  {formatKRW(item.unitPrice * item.quantity)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => runCartAction(() => removeItem(item.id))}
                className="mt-3 self-start text-[13px] tracking-[-0.2px] underline-offset-2 hover:underline"
              >
                삭제하기
              </button>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 flex items-center gap-1 text-[13px] leading-[19px] tracking-[-0.2px]">
        <InfoIcon className="flex-none text-black" />
        {policyText}
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────

type CartItemRowProps = {
  item: CartItem;
  isLast: boolean;
  showShipCell: boolean;
  shipRowSpan: number;
  policy: Policy;
};

function CartItemRow({ item, isLast, showShipCell, shipRowSpan, policy }: CartItemRowProps) {
  const shippingFee = useCartStore((s) => s.summary.shippingFee);
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
              onCheckedChange={() => runCartAction(() => toggleSelected(item.id))}
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
            <UnavailableNote item={item} />
            <button
              type="button"
              onClick={() => runCartAction(() => removeItem(item.id))}
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
          onChange={(next) => runCartAction(() => updateQuantity(item.id, next))}
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
          {/* 선택한 상품 기준 실제 배송비. 예전에는 항상 "무료"로 보였다. */}
          <span className="flex items-center justify-center gap-1 text-[15px] font-normal">
            {shippingFee === 0 ? "무료" : formatKRW(shippingFee)}
            <InfoIcon className="text-black" />
          </span>
          {policy && policy.freeThreshold > 0 ? (
            <p className="mt-2 text-[15px] font-normal leading-[19px] tracking-[-0.2px]">
              {formatKRW(policy.freeThreshold)} 이상 구매 시 무료
              <br />
              (배송비 {formatKRW(policy.standardFee)})
            </p>
          ) : null}
        </td>
      ) : null}
    </tr>
  );
}
