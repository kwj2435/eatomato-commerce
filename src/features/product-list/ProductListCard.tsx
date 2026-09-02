import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils/cn";
import { formatKRW } from "@/lib/utils/format";
import type { Product, ProductBadge } from "@/types/product";

type ProductListCardProps = {
  product: Product;
  className?: string;
};

/**
 * 상품 리스트 페이지 전용 카드.
 *
 * 메인 페이지의 `ProductCard` 와 다르게:
 * - 상품명이 17px/600 으로 더 굵고, SALE/BEST 배지가 더 크다(시안 실측 18px).
 * - hover 시 썸네일이 서브 이미지로 교체된다(모든 카드 공통 규칙).
 *
 * 카드 전체가 링크. 배지는 `pointer-events-none` 으로 링크 클릭 히트 영역을 방해하지 않는다.
 */
export function ProductListCard({ product, className }: ProductListCardProps) {
  const hasDiscount = product.salePrice !== undefined;
  const displayPrice = product.salePrice ?? product.price;

  return (
    <article className={cn("flex flex-col", className)}>
      <Link
        href={`/products/${product.slug}`}
        className="group flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-white">
          {product.badges?.length ? <BadgeStack badges={product.badges} /> : null}

          {/* 기본 이미지 레이어 */}
          <div className="absolute inset-0 flex items-center justify-center bg-white transition-opacity duration-300 group-hover:opacity-0">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(min-width: 1200px) 392px, (min-width: 768px) 40vw, 90vw"
                className="object-cover"
              />
            ) : (
              <span className="text-[48px] font-normal tracking-[-1px] text-ink-placeholder">
                제품이미지
              </span>
            )}
          </div>

          {/* 호버 이미지 레이어 */}
          <div className="absolute inset-0 flex items-center justify-center bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {product.hoverImageUrl ? (
              <Image
                src={product.hoverImageUrl}
                alt={`${product.name} 서브 이미지`}
                fill
                sizes="(min-width: 1200px) 392px, (min-width: 768px) 40vw, 90vw"
                className="object-cover"
              />
            ) : (
              <span className="text-[48px] font-normal tracking-[-1px] text-ink-placeholder">
                제품이미지 2
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center gap-1">
          <p className="text-[17px] font-semibold leading-[23px] tracking-[-0.3px] text-black">
            {product.name}
          </p>
          {product.option ? (
            <p className="text-[12.5px] font-normal leading-5 tracking-[-0.2px] text-ink-muted">
              {product.option}
            </p>
          ) : null}
          <p className="flex items-center gap-1.5 text-[12.5px] leading-5 tracking-[-0.2px]">
            <span className="text-ink-muted">{formatKRW(displayPrice)}</span>
            {hasDiscount ? (
              <span className="text-ink-subtle line-through">
                {formatKRW(product.price)}
              </span>
            ) : null}
          </p>
        </div>
      </Link>
    </article>
  );
}

const BADGE_STYLES: Record<ProductBadge, string> = {
  SALE: "bg-[#EEAB99] text-white",
  BEST: "bg-[#EEAB99] text-white",
  NEW: "bg-brand-badge text-white",
};

function BadgeStack({ badges }: { badges: ProductBadge[] }) {
  return (
    <div className="pointer-events-none absolute left-[11px] top-[10px] z-10 flex flex-col items-start gap-0.5">
      {badges.map((badge) => (
        <span
          key={badge}
          className={cn(
            "px-[17px] py-1 text-[18px] font-medium leading-[22px] tracking-[-0.2px]",
            BADGE_STYLES[badge],
          )}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}
