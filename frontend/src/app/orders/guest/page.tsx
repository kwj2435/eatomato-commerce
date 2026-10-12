import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { GuestOrderLookup } from "@/features/guest-order/GuestOrderLookup";

export const metadata: Metadata = {
  title: "비회원 주문 조회",
  description: "주문번호와 주문 비밀번호로 비회원 주문을 확인하세요.",
  robots: { index: false, follow: false },
};

export default function GuestOrderPage() {
  return (
    <SiteFrame>
      <div className="pb-[112px] pt-[27px]">
        <GuestOrderLookup />
      </div>
    </SiteFrame>
  );
}
