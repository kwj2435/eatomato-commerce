import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { ReviewWriteForm } from "@/features/review-write/ReviewWriteForm";
import { listReviewableProducts } from "@/lib/api/reviews";

export const metadata: Metadata = {
  title: "후기 쓰기",
  description: "구매하신 상품의 후기를 남겨주세요.",
};

export default async function ReviewWritePage() {
  const products = await listReviewableProducts();

  return (
    <SiteFrame>
      <ReviewWriteForm products={products} />
    </SiteFrame>
  );
}
