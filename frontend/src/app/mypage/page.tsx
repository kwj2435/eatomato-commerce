import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { MyPageView } from "@/features/mypage/MyPageView";

export const metadata: Metadata = {
  title: "마이페이지",
  description: "주문 내역과 회원 정보를 확인하고 수정하세요.",
};

export default function MyPage() {
  return (
    <SiteFrame>
      <MyPageView />
    </SiteFrame>
  );
}
