import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { PrivacyPolicy } from "@/features/policy/PrivacyPolicy";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description: "eatomato 개인정보 처리방침",
};

export default function PrivacyPage() {
  return (
    <SiteFrame>
      <PrivacyPolicy />
    </SiteFrame>
  );
}
