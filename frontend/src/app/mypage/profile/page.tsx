import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { ProfileEditView } from "@/features/mypage/ProfileEditView";

export const metadata: Metadata = {
  title: "회원 정보 수정",
  robots: { index: false, follow: false },
};

export default function ProfileEditPage() {
  return (
    <SiteFrame>
      <ProfileEditView />
    </SiteFrame>
  );
}
