import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { CheckoutView } from "@/features/checkout/CheckoutView";

export const metadata: Metadata = { title: "주문서", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return (
    <SiteFrame>
      <CheckoutView />
    </SiteFrame>
  );
}
