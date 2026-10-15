import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { TermsOfUse } from "@/features/policy/TermsOfUse";

export const metadata: Metadata = {
  title: "이용약관",
  description: "eatomato 이용약관",
};

export default function TermsPage() {
  return (
    <SiteFrame>
      <TermsOfUse />
    </SiteFrame>
  );
}
