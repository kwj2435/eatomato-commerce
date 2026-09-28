"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils/cn";
import { formatKRW } from "@/lib/utils/format";
import type { BetterTogetherItem } from "@/types/product-detail";

import { OptionSelect } from "./OptionSelect";

type BetterTogetherProps = {
  items: BetterTogetherItem[];
  selections: Record<string, Record<string, string>>;
  onChangeSelection: (itemId: string, groupId: string, choiceId: string) => void;
};

/**
 * 함께 구매(BETTER TOGETHER) 패널.
 *
 * 각 후보 상품은 자기 옵션 그룹을 가진다. 옵션 선택 상태는 부모(`ProductBuyPanel`) 에서 통합 관리해
 * 총 합계 계산과 카트 담기 로직이 한 곳에 모이도록 했다.
 * 접힘/펼침은 로컬 UI 상태이므로 이 컴포넌트가 소유.
 */
export function BetterTogether({
  items,
  selections,
  onChangeSelection,
}: BetterTogetherProps) {
  const [open, setOpen] = useState(true);

  return (
    <section className="mt-4 border border-[#333]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-[62px] w-full items-center justify-between border-b border-[#333] px-5"
      >
        <span className="text-[14px] font-bold tracking-[0.4px] text-[#545454]">
          BETTER TOGETHER
        </span>
        <svg
          width="12"
          height="7"
          viewBox="0 0 12 7"
          fill="none"
          aria-hidden
          className={cn("transition-transform", open ? "rotate-0" : "rotate-180")}
        >
          <path d="M1 6L6 1L11 6" stroke="#333333" strokeWidth="1.2" />
        </svg>
      </button>

      {open ? (
        <div className="flex flex-col gap-[18px] px-5 py-5">
          {items.map((item) => (
            <BetterTogetherRow
              key={item.id}
              item={item}
              selection={selections[item.id] ?? {}}
              onChange={(groupId, choiceId) =>
                onChangeSelection(item.id, groupId, choiceId)
              }
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function BetterTogetherRow({
  item,
  selection,
  onChange,
}: {
  item: BetterTogetherItem;
  selection: Record<string, string>;
  onChange: (groupId: string, choiceId: string) => void;
}) {
  const hasSale = item.salePrice !== undefined;
  const currentPrice = item.salePrice ?? item.price;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex gap-4">
        <div className="relative h-[60px] w-[60px] flex-none overflow-hidden bg-[#EDEDED]">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="60px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-2.5">
          <Link
            href={`/products/${item.slug}`}
            className="text-[14px] font-bold tracking-[-0.2px] text-ink-body hover:text-brand-primary"
          >
            {item.name}
          </Link>
          <p className="flex items-baseline gap-1.5 text-[14px] tracking-[-0.2px]">
            <span className="text-[#545454]">{formatKRW(currentPrice)}</span>
            {hasSale ? (
              <span className="text-ink-subtle line-through">
                {formatKRW(item.price)}
              </span>
            ) : null}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {item.optionGroups.map((group) => (
          <OptionSelect
            key={group.id}
            group={group}
            value={selection[group.id] ?? null}
            onChange={(choiceId) => onChange(group.id, choiceId)}
            hideLabel
            placeholder={group.label}
          />
        ))}
      </div>
    </div>
  );
}
