import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata: Metadata = {
  title: "로그인",
  description: "eatomato 회원 로그인",
};

export default function LoginPage() {
  return (
    <SiteFrame>
      <main className="pb-[112px] pt-[27px]">
        <LoginForm />
      </main>
    </SiteFrame>
  );
}
