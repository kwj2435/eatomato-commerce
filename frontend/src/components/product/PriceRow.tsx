import { cn } from "@/lib/utils/cn";
import { formatKRW } from "@/lib/utils/format";
import type { ProductBadge } from "@/types/product";

/** 정상가 대비 할인율(%). 할인이 없거나 할인가가 정상가 이상이면 null. */
export function discountRate(price: number, salePrice?: number | null): number | null {
  if (salePrice == null || price <= 0 || salePrice >= price) return null;
  const rate = Math.round(((price - salePrice) / price) * 100);
  return rate > 0 ? rate : null;
}

/**
 * 카드 위에 올릴 배지. SALE 은 거의 모든 상품에 붙어 구분이 안 되므로 그림에서 빼고
 * (가격 옆 할인율로 대신 보인다) NEW → BEST 순서로 고정한다.
 */
const BADGE_ORDER: ProductBadge[] = ["NEW", "BEST"];

export function cardBadges(badges?: ProductBadge[]): ProductBadge[] {
  if (!badges?.length) return [];
  return BADGE_ORDER.filter((badge) => badges.includes(badge));
}

type PriceRowProps = {
  price: number;
  salePrice?: number | null;
  className?: string;
};

/**
 * 상품 가격 한 줄: "15%  19,550원  ~~23,000원~~".
 * 할인율은 브랜드 빨강, 판매가는 진하게, 정가는 취소선. 할인이 없으면 판매가만 보인다.
 * 글자 크기·정렬은 호출부가 className 으로 정한다.
 */
export function PriceRow({ price, salePrice, className }: PriceRowProps) {
  const rate = discountRate(price, salePrice);
  const current = rate ? salePrice! : price;

  return (
    <p className={cn("flex flex-wrap items-center gap-x-1.5 leading-5 tracking-[-0.2px]", className)}>
      {rate ? (
        <span className="font-semibold text-brand-primary">
          {rate}%<span className="sr-only"> 할인</span>
        </span>
      ) : null}
      <span className="font-medium text-ink-muted">
        {rate ? <span className="sr-only">판매가 </span> : null}
        {formatKRW(current)}
      </span>
      {rate ? (
        <span className="text-ink-subtle line-through">
          <span className="sr-only">정가 </span>
          {formatKRW(price)}
        </span>
      ) : null}
    </p>
  );
}
