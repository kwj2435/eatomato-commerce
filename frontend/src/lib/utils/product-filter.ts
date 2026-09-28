import type { Product } from "@/types/product";

/**
 * 상품 정렬·검색의 순수 로직.
 *
 * `lib/api/products.ts` 에서 분리한 이유:
 * 그 파일은 mock 데이터 전체를 import 하므로, 클라이언트 컴포넌트가 정렬 함수 하나를 쓰려고
 * import 하면 상품·상세 mock 이 통째로 클라이언트 번들에 딸려 들어갈 수 있다.
 * 데이터 의존이 없는 이 파일로 떼어 두면 서버·클라이언트 양쪽에서 안전하게 재사용된다.
 *
 * (정적 배포에서는 정렬·검색을 클라이언트가 수행한다. 실 API 를 붙이면 서버가 다시
 *  이 로직을 대신하게 되므로, 그때는 이 파일의 사용처가 서버로 돌아간다.)
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

/**
 * 검색어 일치 판정. 상품명과 옵션 라벨을 대상으로 한다.
 * 카테고리명까지 넣으면 "케이스" 검색에 액세서리가 딸려 오는 등 오탐이 늘어 제외했다.
 */
export function matchesQuery(product: Product, keyword: string): boolean {
  return `${product.name} ${product.option ?? ""}`
    .toLowerCase()
    .includes(keyword);
}
