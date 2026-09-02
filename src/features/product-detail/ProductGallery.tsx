import Image from "next/image";

import type { ProductDetail } from "@/types/product-detail";

type ProductGalleryProps = {
  product: ProductDetail;
};

/**
 * 상품 상세의 좌측 대표 이미지.
 *
 * 시안은 단일 대표 이미지지만, 실서비스에서는 썸네일 다중 이미지 갤러리로 진화한다.
 * 진화 지점을 이 컴포넌트로 격리해 두었으므로 다른 곳은 손대지 않고 확장할 수 있다.
 */
export function ProductGallery({ product }: ProductGalleryProps) {
  return (
    <div className="w-full lg:w-[583px] lg:flex-none">
      <div className="relative aspect-[3/4] w-full overflow-hidden border border-[#B0AAA9] bg-white">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            priority
            sizes="(min-width: 1200px) 583px, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[56px] font-normal tracking-[-1px] text-ink-placeholder">
              제품이미지
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
