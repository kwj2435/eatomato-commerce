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
import {
  DEFAULT_SORT,
  sortProducts,
  type SortValue,
} from "@/lib/utils/product-filter";

/**
 * 상품 API.
 *
 * 현재는 mock 데이터를 그대로 반환하지만, 시그니처는 실제 API 호출과 동일하게 유지한다.
 * 실서버 연동 시 이 파일 내부만 fetch(...) 호출로 교체하면 UI 코드는 무변경.
 *
 * 서버 컴포넌트에서만 호출한다고 가정. 클라이언트에서 필요할 경우 별도 client SDK 를 둔다.
 */

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

/**
 * 검색 대상 상품 목록.
 *
 * 정적 배포에서는 서버가 `searchParams` 를 읽을 수 없어, 서버는 후보 목록만 넘기고
 * 실제 필터·정렬은 클라이언트(SearchResults)가 `lib/utils/product-filter` 로 수행한다.
 *
 * 실 API 를 붙이면 이 함수 자리에 `searchProducts({ query, sort })` 가 들어와
 * 서버가 형태소 분석·동의어까지 처리한 결과를 그대로 반환하게 된다.
 */
export async function listSearchableProducts(): Promise<Product[]> {
  return MOCK_PRODUCTS;
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
