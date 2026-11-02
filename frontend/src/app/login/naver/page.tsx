import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { NaverCallback } from "@/features/auth/NaverCallback";

export const metadata: Metadata = {
  title: "네이버 로그인",
  robots: { index: false, follow: false },
};

export default function NaverCallbackPage() {
  return (
    <SiteFrame>
      <div>
        <NaverCallback />
      </div>
    </SiteFrame>
  );
}
