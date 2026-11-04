import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { CartView } from "@/features/cart/CartView";
import { listBestProducts } from "@/lib/api/products";

export const metadata: Metadata = {
  title: "장바구니",
  description: "선택한 상품을 확인하고 결제로 넘어가세요.",
};

export default async function CartPage() {
  // 빈 장바구니 추천 상품. 메인 Best Picks 와 같은 BEST 상품이다.
  // 불러오지 못해도 장바구니는 열려야 하므로 실패하면 추천만 뺀다.
  const recommended = await listBestProducts({ limit: 4 }).catch(() => []);

  return (
    <SiteFrame>
      <CartView recommended={recommended} />
    </SiteFrame>
  );
}
