"use client";

import { useCartSummary } from "@/lib/store/cart-store";
import { formatKRW } from "@/lib/utils/format";

/**
 * 선택된 상품의 결제 요약.
 * 값 계산은 스토어의 파생 selector 가 담당해 화면은 표시만 한다.
 */
export function CartSummary() {
  const { subtotal, shippingFee, total } = useCartSummary();

  return (
    <div className="ml-auto mt-[29px] w-full max-w-[630px]">
      <SummaryRow label="상품 합계" value={formatKRW(subtotal)} />
      <SummaryRow label="배송비" value={formatKRW(shippingFee)} />

      <div className="mt-6 h-[1.5px] w-full bg-black" />

      <div className="mt-[26px] grid h-[21px] grid-cols-[356px_274px] items-center text-[17px] font-bold tracking-[-0.2px] text-black">
        <span className="text-right">합계</span>
        <span className="text-right">{formatKRW(total)}</span>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-[29px] grid h-[19px] grid-cols-[356px_274px] items-center text-[15px] tracking-[-0.2px] last-of-type:mb-0">
      <span className="text-right">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
