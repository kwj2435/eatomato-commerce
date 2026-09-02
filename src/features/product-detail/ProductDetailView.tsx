import { Container } from "@/components/layout/Container";
import type { ProductDetail } from "@/types/product-detail";

import { DetailsSection } from "./DetailsSection";
import { DetailTabs } from "./DetailTabs";
import { ProductBuyPanel } from "./ProductBuyPanel";
import { ProductGallery } from "./ProductGallery";
import { ReviewsSection } from "./ReviewsSection";
import { ShippingSection } from "./ShippingSection";

type ProductDetailViewProps = {
  product: ProductDetail;
};

/**
 * 상세 페이지 조립 컴포넌트 (서버).
 * 상단 좌우 2단(gallery + buy panel) → 앵커 탭 → 3개 섹션.
 * 상호작용이 필요한 buy panel 만 client, 나머지는 서버 컴포넌트로 유지.
 */
export function ProductDetailView({ product }: ProductDetailViewProps) {
  return (
    <>
      <Container as="section" aria-label="상품 정보" className="pt-14">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-[118px]">
          <ProductGallery product={product} />
          <ProductBuyPanel product={product} />
        </div>
      </Container>

      <DetailTabs />
      <DetailsSection images={product.detailImages} />
      <ShippingSection lines={product.shippingLines} />
      <ReviewsSection
        reviews={product.reviews}
        reviewCount={product.reviewCount}
        averageRating={product.rating}
      />
    </>
  );
}
