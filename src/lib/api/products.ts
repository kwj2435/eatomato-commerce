import {
  findMockProductDetail,
  listMockProductSlugs,
} from "@/lib/mock/product-details";
import { MOCK_PRODUCTS } from "@/lib/mock/products";
import type {
  CategoryKey,
  Product,
  SubcategoryKey,
} from "@/types/product";
import type { ProductDetail } from "@/types/product-detail";

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

// ────────────────────────────────────────────────────────────────

export type SearchProductsParams = {
  /** 검색어. 공백만 있거나 비어 있으면 빈 배열을 반환한다(전체 노출이 아니라 "검색 전" 상태). */
  query: string;
  sort?: SortValue;
};

/**
 * 상품 검색.
 *
 * 검색 대상은 상품명과 옵션 라벨이다. mock 단계라 단순 부분 일치로 처리하지만,
 * 실서비스에서는 서버가 형태소 분석·동의어까지 처리하므로 이 함수는 질의 전달만 남는다.
 *
 * 빈 검색어에 전체 목록을 돌려주지 않는 이유:
 * 검색 페이지의 초기 진입(검색어 없음)과 "결과 0건" 은 사용자에게 다른 상태이고,
 * 이를 호출부가 `query` 유무로 구분할 수 있어야 안내 문구를 나눠 보여줄 수 있다.
 */
export async function searchProducts(
  params: SearchProductsParams,
): Promise<Product[]> {
  const { query, sort = DEFAULT_SORT } = params;
  const keyword = query.trim().toLowerCase();
  if (!keyword) return [];

  const matched = MOCK_PRODUCTS.filter((product) =>
    `${product.name} ${product.option ?? ""}`.toLowerCase().includes(keyword),
  );

  return sortProducts(matched, sort);
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

// ────────────────────────────────────────────────────────────────

/**
 * 슬러그로 상품 상세를 조회한다.
 * 서버 컴포넌트에서 이 값을 await 로 받아 `notFound()` 처리에 사용한다.
 * 실서비스에서는 `fetch(`${API_BASE}/products/${slug}`)` 로 교체.
 */
export async function getProductDetail(slug: string): Promise<ProductDetail | null> {
  return findMockProductDetail(slug);
}

/** 정적 파라미터 생성용 슬러그 목록. */
export async function listAllProductSlugs(): Promise<string[]> {
  return listMockProductSlugs();
}
