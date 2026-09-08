import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { MyPageView } from "@/features/mypage/MyPageView";
import { getMyMember } from "@/lib/api/member";

export const metadata: Metadata = {
  title: "마이페이지",
  description: "주문 내역과 회원 정보를 확인하고 수정하세요.",
};

export default async function MyPage() {
  const member = await getMyMember();

  return (
    <SiteFrame>
      <MyPageView member={member} />
    </SiteFrame>
  );
}
