import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { SignupForm } from "@/features/auth/SignupForm";

export const metadata: Metadata = {
  title: "회원가입",
  description: "eatomato 회원가입",
};

export default function SignupPage() {
  return (
    <SiteFrame>
      <div className="pb-[112px] pt-[27px]">
        <SignupForm />
      </div>
    </SiteFrame>
  );
}
