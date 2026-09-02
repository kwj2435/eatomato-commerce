import { MOCK_PRODUCTS } from "@/lib/mock/products";
import type {
  CategoryKey,
  Product,
  SubcategoryKey,
} from "@/types/product";

/**
 * 상품 API.
 *
 * 현재는 mock 데이터를 그대로 반환하지만, 시그니처는 실제 API 호출과 동일하게 유지한다.
 * 실서버 연동 시 이 파일 내부만 fetch(...) 호출로 교체하면 UI 코드는 무변경.
 *
 * 서버 컴포넌트에서만 호출한다고 가정. 클라이언트에서 필요할 경우 별도 client SDK 를 둔다.
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
export function normalizeSort(input: string | undefined): SortValue {
  return SORT_OPTIONS.some((o) => o.value === input)
    ? (input as SortValue)
    : DEFAULT_SORT;
}

export function getSortLabel(value: SortValue): string {
  return SORT_OPTIONS.find((o) => o.value === value)!.label;
}

// ────────────────────────────────────────────────────────────────

export type ListNewProductsParams = {
  limit?: number;
};

export async function listNewProducts(
  params: ListNewProductsParams = {},
): Promise<Product[]> {
  const { limit = 4 } = params;
  // 실제 서비스에서는:
  //   const res = await fetch(`${API_BASE}/products/new?limit=${limit}`, { next: { revalidate: 60 } });
  //   if (!res.ok) throw new Error("Failed to fetch new products");
  //   return res.json();
  return MOCK_PRODUCTS.filter((p) => p.badges?.includes("NEW")).slice(0, limit);
}

// ────────────────────────────────────────────────────────────────

export type ListProductsParams = {
  category: CategoryKey;
  /** `undefined` 은 카테고리 전체를 의미한다. */
  subcategory?: SubcategoryKey;
  sort?: SortValue;
};

export async function listProducts(
  params: ListProductsParams,
): Promise<Product[]> {
  const { category, subcategory, sort = DEFAULT_SORT } = params;

  // 실제 서비스에서는:
  //   const qs = new URLSearchParams({ category, sort, ...(subcategory && { subcategory }) });
  //   const res = await fetch(`${API_BASE}/products?${qs}`, { next: { revalidate: 60 } });
  //   if (!res.ok) throw new Error("Failed to fetch products");
  //   return res.json();

  const filtered = MOCK_PRODUCTS.filter((product) => {
    if (product.category !== category) return false;
    if (subcategory && product.subcategory !== subcategory) return false;
    return true;
  });

  return sortProducts(filtered, sort);
}

/**
 * 정렬은 원 배열을 훼손하지 않도록 얕은 복사 후 정렬.
 * 별도 함수로 뽑아 두면 실 API 로 옮길 때 이 로직만 삭제하면 된다.
 */
function sortProducts(products: Product[], sort: SortValue): Product[] {
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
