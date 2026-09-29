import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { CheckoutFail } from "@/features/checkout/CheckoutFail";

export const metadata: Metadata = { title: "결제 실패", robots: { index: false, follow: false } };

export default function CheckoutFailPage() {
  return (
    <SiteFrame>
      <Suspense>
        <CheckoutFail />
      </Suspense>
    </SiteFrame>
  );
}
