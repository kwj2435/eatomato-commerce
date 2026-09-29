import Image from "next/image";
import Link from "next/link";

import { SoldOutOverlay } from "@/components/product/SoldOutOverlay";
import { cn } from "@/lib/utils/cn";
import { formatKRW } from "@/lib/utils/format";
import type { Product, ProductBadge } from "@/types/product";

type ProductCardProps = {
  product: Product;
  className?: string;
};

/**
 * 상품 카드.
 *
 * - 썸네일은 3:4 고정 비율.
 * - 이미지가 없을 때는 시안처럼 회색 placeholder 텍스트를 노출.
 * - 할인이 있으면 salePrice(현재가)를 진하게, 정가는 취소선.
 * - 카드 전체가 링크. 접근성을 위해 내부에 인터랙션 요소를 중첩하지 않는다.
 */
export function ProductCard({ product, className }: ProductCardProps) {
  const hasDiscount = product.salePrice !== undefined;
  const displayPrice = product.salePrice ?? product.price;

  return (
    <article className={cn("flex flex-col", className)}>
      <Link
        href={`/products/${product.slug}`}
        className="group flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-elevated">
          {product.badges?.length ? <BadgeGroup badges={product.badges} /> : null}
          {product.soldOut ? <SoldOutOverlay /> : null}

          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(min-width: 1200px) 292px, (min-width: 768px) 40vw, 80vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[40px] font-normal tracking-[-0.8px] text-ink-placeholder">
                제품이미지
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-col items-center text-center md:mt-5">
          <p className="mb-1.5 text-[14px] font-normal leading-5 tracking-[-0.2px] text-black md:mb-[11px] md:text-[16px] md:leading-[23px]">
            {product.name}
          </p>
          {product.option ? (
            <p className="text-[12px] font-normal leading-5 tracking-[-0.2px] text-ink-muted md:text-[12.5px]">
              {product.option}
            </p>
          ) : null}
          <p className="flex items-center gap-1.5 text-[12px] leading-5 tracking-[-0.2px] md:text-[12.5px]">
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
  NEW: "bg-brand-badge text-ink-inverse",
  BEST: "bg-brand-badge text-ink-inverse",
  SALE: "bg-black text-ink-inverse",
};

function BadgeGroup({ badges }: { badges: ProductBadge[] }) {
  return (
    <div className="absolute left-3.5 top-3.5 z-10 flex flex-col items-start gap-1">
      {/* 배지 문구 길이와 무관하게 박스 크기를 통일하기 위해 고정 폭 + 가운데 정렬 */}
      {badges.map((badge) => (
        <span
          key={badge}
          className={cn(
            "w-[52px] py-1 text-center text-[12px] font-medium tracking-[0.4px]",
            BADGE_STYLES[badge],
          )}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}
