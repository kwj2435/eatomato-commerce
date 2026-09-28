import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { CartView } from "@/features/cart/CartView";

export const metadata: Metadata = {
  title: "장바구니",
  description: "선택한 상품을 확인하고 결제로 넘어가세요.",
};

export default function CartPage() {
  return (
    <SiteFrame>
      <CartView />
    </SiteFrame>
  );
}
