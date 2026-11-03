import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { WithdrawView } from "@/features/mypage/WithdrawView";

export const metadata: Metadata = {
  title: "회원 탈퇴",
  robots: { index: false, follow: false },
};

export default function WithdrawPage() {
  return (
    <SiteFrame>
      <div className="pb-[112px] pt-[27px]">
        <WithdrawView />
      </div>
    </SiteFrame>
  );
}
