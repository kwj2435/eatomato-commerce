import type { Product } from "@/types/product";

/**
 * 상품 정렬의 순수 로직.
 *
 * `lib/api/products.ts` 에서 분리한 이유:
 * 데이터 의존이 없는 순수 함수라 서버·클라이언트 양쪽에서 안전하게 재사용된다.
 *
 * 상품 리스트는 빌드 시점에 받은 목록을 브라우저에서 URL 쿼리(`?sort=`)대로 다시 정렬하므로
 * 서버(ProductSort)와 같은 규칙을 여기에도 둔다. 검색은 서버가 정렬까지 해서 돌려준다.
 */

/**
 * 상품 정렬 옵션.
 * URL 쿼리(`?sort=popularity`)와 1:1 매핑되며, UI 는 이 리터럴 유니온에 의존한다.
 */
export const SORT_OPTIONS = [
  { value: "price-asc", label: "낮은가격순" },
  { value: "price-desc", label: "높은가격순" },
  { value: "popularity", label: "판매많은순" },
  { value: "rating", label: "평점높은순" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
export const DEFAULT_SORT: SortValue = "popularity";

/** URL 쿼리에서 넘어온 문자열을 안전하게 SortValue 로 좁힌다. */
export function normalizeSort(input: string | undefined | null): SortValue {
  return SORT_OPTIONS.some((o) => o.value === input)
    ? (input as SortValue)
    : DEFAULT_SORT;
}

export function getSortLabel(value: SortValue): string {
  return SORT_OPTIONS.find((o) => o.value === value)!.label;
}

/** 정렬은 원 배열을 훼손하지 않도록 얕은 복사 후 정렬. */
export function sortProducts(products: Product[], sort: SortValue): Product[] {
  const copy = [...products];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => currentPrice(a) - currentPrice(b));
    case "price-desc":
      return copy.sort((a, b) => currentPrice(b) - currentPrice(a));
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating);
    case "popularity":
    default:
      return copy.sort((a, b) => b.salesCount - a.salesCount);
  }
}

function currentPrice(product: Product): number {
  return product.salePrice ?? product.price;
}
