"use client";

import type { ReactNode } from "react";

import { useIsLoggedIn } from "@/lib/store/auth-store";
import { useCartStore, useCartSummary } from "@/lib/store/cart-store";
import { formatKRW } from "@/lib/utils/format";

type CartSummaryProps = {
  /** 주문하기 버튼. 데스크톱에서만 카드 안에 보인다(모바일은 CartView 의 하단 고정 바). */
  action: ReactNode;
  /** 주문 실패 안내. 데스크톱 카드 안에 보인다. */
  message?: string | null;
};

/**
 * 선택된 상품의 결제 예정 금액 카드.
 * 값 계산은 서버가 하고 화면은 표시만 한다. 데스크톱에서는 목록 오른쪽에 붙어 스크롤을 따라온다.
 */
export function CartSummary({ action, message }: CartSummaryProps) {
  const summary = useCartSummary();
  const { subtotal, shippingFee, total } = summary;
  // discount·rewardPoints 는 나중에 추가된 필드라, 프론트가 백엔드보다 먼저 배포돼도 NaN 이 되지 않게 0 으로 본다.
  const discount = summary.discount ?? 0;
  const rewardPoints = summary.rewardPoints ?? 0;
  const policy = useCartStore((s) => s.policy);
  // 비회원은 적립금이 쌓이지 않으므로 적립 예정 금액을 보여 주지 않는다.
  const loggedIn = useIsLoggedIn();

  return (
    <aside
      aria-labelledby="cart-summary-title"
      className="border border-[#F0E2DE] bg-surface-elevated px-6 py-[26px] lg:sticky lg:top-6"
    >
      <h2 id="cart-summary-title" className="mb-[18px] text-[16px] font-bold tracking-[-0.2px] text-ink-primary">
        결제 예정 금액
      </h2>

      <SummaryRow label="상품 금액" value={formatKRW(subtotal + discount)} />
      {discount > 0 ? (
        <SummaryRow label="상품 할인" value={`−${formatKRW(discount)}`} valueClassName="text-brand-primary" />
      ) : null}
      <SummaryRow label="배송비" value={shippingFee === 0 ? "무료" : `+${formatKRW(shippingFee)}`} />

      <div className="mt-3.5 flex items-baseline justify-between border-t border-ink-primary pt-[18px]">
        <span className="text-[15px] font-semibold text-ink-primary">합계</span>
        <strong className="text-[24px] font-extrabold tracking-[-0.6px] text-ink-primary">{formatKRW(total)}</strong>
      </div>
      {loggedIn && rewardPoints > 0 ? (
        <p className="mt-1.5 text-right text-[12.5px] text-ink-subtle">
          구매 시 <b className="font-semibold text-brand-deep">{formatKRW(rewardPoints)}</b> 적립 예정
        </p>
      ) : null}

      <div className="mt-[22px] hidden lg:block">{action}</div>
      {message ? (
        <p role="alert" className="mt-3 hidden text-[13px] text-brand-primary lg:block">
          {message}
        </p>
      ) : null}

      <ul className="mt-4 space-y-0.5 text-[12.5px] leading-[1.7] text-ink-subtle">
        {policy ? (
          <li>
            ·{" "}
            {policy.freeThreshold > 0
              ? `${formatKRW(policy.freeThreshold)} 이상 구매 시 무료배송`
              : "전 상품 무료배송"}
          </li>
        ) : null}
        {policy && policy.remoteAreaFee > 0 ? (
          <li>· 제주 지역은 배송비 {formatKRW(policy.remoteAreaFee)}이 추가돼요.</li>
        ) : null}
        <li>· 평일 출고 (주말 및 공휴일 제외)</li>
      </ul>
    </aside>
  );
}

function SummaryRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex justify-between py-[7px] text-[14px] tracking-[-0.2px]">
      <span className="text-ink-muted">{label}</span>
      <span className={valueClassName ?? "text-ink-body"}>{value}</span>
    </div>
  );
}
