import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { KakaoCallback } from "@/features/auth/KakaoCallback";

export const metadata: Metadata = {
  title: "카카오 로그인",
  robots: { index: false, follow: false },
};

export default function KakaoCallbackPage() {
  return (
    <SiteFrame>
      <main>
        <KakaoCallback />
      </main>
    </SiteFrame>
  );
}
