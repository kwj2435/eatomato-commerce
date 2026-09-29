import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { CheckoutComplete } from "@/features/checkout/CheckoutComplete";

export const metadata: Metadata = { title: "주문 완료", robots: { index: false, follow: false } };

export default function CheckoutCompletePage() {
  return (
    <SiteFrame>
      <Suspense>
        <CheckoutComplete />
      </Suspense>
    </SiteFrame>
  );
}
