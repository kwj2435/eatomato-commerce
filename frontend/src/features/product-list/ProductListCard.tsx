import Image from "next/image";
import Link from "next/link";

import { PriceRow, cardBadges } from "@/components/product/PriceRow";
import { SoldOutOverlay } from "@/components/product/SoldOutOverlay";
import { cn } from "@/lib/utils/cn";
import type { Product, ProductBadge } from "@/types/product";

type ProductListCardProps = {
  product: Product;
  className?: string;
};

/**
 * 상품 리스트 페이지 전용 카드.
 *
 * 메인 페이지의 `ProductCard` 와 다르게:
 * - 상품명이 17px/600 으로 더 굵고, NEW/BEST 배지가 더 크다(14px).
 * - SALE 배지 대신 가격 옆에 할인율을 보인다(PriceRow). 배지는 NEW → BEST 순서 고정.
 * - hover 시 썸네일이 서브 이미지로 교체된다(모든 카드 공통 규칙).
 *
 * 카드 전체가 링크. 배지는 `pointer-events-none` 으로 링크 클릭 히트 영역을 방해하지 않는다.
 */
export function ProductListCard({ product, className }: ProductListCardProps) {
  const badges = cardBadges(product.badges);

  return (
    <article className={cn("flex flex-col", className)}>
      <Link
        href={`/products/${product.slug}`}
        className="group flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          {badges.length ? <BadgeStack badges={badges} /> : null}
          {product.soldOut ? <SoldOutOverlay /> : null}

          {/* 기본 이미지 레이어 */}
          <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(min-width: 1200px) 292px, (min-width: 768px) 25vw, 50vw"
                className="object-cover"
              />
            ) : (
              <span className="text-[48px] font-normal tracking-[-1px] text-ink-placeholder">
                제품이미지
              </span>
            )}
          </div>

          {/* 호버 이미지 레이어 */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {product.hoverImageUrl ? (
              <Image
                src={product.hoverImageUrl}
                alt={`${product.name} 서브 이미지`}
                fill
                sizes="(min-width: 1200px) 292px, (min-width: 768px) 25vw, 50vw"
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
          <PriceRow price={product.price} salePrice={product.salePrice} className="justify-center text-[12.5px]" />
        </div>
      </Link>
    </article>
  );
}

const BADGE_STYLES: Partial<Record<ProductBadge, string>> = {
  NEW: "bg-brand-badge text-white",
  BEST: "bg-brand-badge text-white",
};

function BadgeStack({ badges }: { badges: ProductBadge[] }) {
  return (
    <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 flex flex-col items-start gap-px sm:left-[11px] sm:top-[10px] sm:gap-0.5">
      {/* 배지 문구 길이와 무관하게 박스 크기를 통일하기 위해 고정 폭 + 가운데 정렬 */}
      {badges.map((badge) => (
        <span
          key={badge}
          className={cn(
            "w-[38px] py-px text-center text-[10px] font-medium leading-[14px] tracking-[-0.2px] sm:w-[58px] sm:py-1 sm:text-[14px] sm:leading-[18px]",
            BADGE_STYLES[badge],
          )}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}
