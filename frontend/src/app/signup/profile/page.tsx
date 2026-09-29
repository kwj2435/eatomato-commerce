import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { ProfileForm } from "@/features/auth/ProfileForm";

export const metadata: Metadata = { title: "추가 정보 입력", robots: { index: false, follow: false } };

export default function SignupProfilePage() {
  return (
    <SiteFrame>
      <div className="pb-[112px] pt-[27px]">
        <ProfileForm />
      </div>
    </SiteFrame>
  );
}
