import type { CategoryKey, Product, SubcategoryKey } from "@/types/product";
import type { ProductDetail, ProductReview } from "@/types/product-detail";
import { DEFAULT_SORT, type SortValue } from "@/lib/utils/product-filter";

import { apiFetch, apiFetchOrNull } from "./client";

/**
 * 상품 API.
 *
 * `listNewProducts` · `listProducts` · `getProductDetail` · `listAllProductSlugs` 는 빌드 시점(서버 컴포넌트)에,
 * `searchProducts` · `listProductReviews` 는 브라우저에서 호출한다.
 */

export type ListNewProductsParams = {
  limit?: number;
};

export async function listNewProducts(
  params: ListNewProductsParams = {},
): Promise<Product[]> {
  const { limit = 4 } = params;
  return apiFetch<Product[]>(`/api/products/new?limit=${limit}`);
}

/** 메인 Best Picks 오른쪽 칸에 넣을 BEST 배지 상품. */
export async function listBestProducts(params: ListNewProductsParams = {}): Promise<Product[]> {
  const { limit = 4 } = params;
  return apiFetch<Product[]>(`/api/products/best?limit=${limit}`);
}

export type ListProductsParams = {
  category: CategoryKey;
  /** `undefined` 은 카테고리 전체를 의미한다. */
  subcategory?: SubcategoryKey;
  sort?: SortValue;
};

export async function listProducts(params: ListProductsParams): Promise<Product[]> {
  const { category, subcategory, sort = DEFAULT_SORT } = params;
  const qs = new URLSearchParams({ category, sort });
  if (subcategory) qs.set("subcategory", subcategory);
  return apiFetch<Product[]>(`/api/products?${qs}`);
}

/** 상품명·옵션 검색. 서버가 검색·정렬까지 해서 돌려준다. */
export async function searchProducts(query: string, sort: SortValue): Promise<Product[]> {
  const qs = new URLSearchParams({ q: query, sort });
  return apiFetch<Product[]>(`/api/products/search?${qs}`);
}

/** 슬러그로 상품 상세를 조회한다. 없으면 `null` → 호출부가 `notFound()` 로 처리한다. */
export async function getProductDetail(slug: string): Promise<ProductDetail | null> {
  return apiFetchOrNull<ProductDetail>(`/api/products/${encodeURIComponent(slug)}`);
}

/** 정적 파라미터 생성용 슬러그 목록. */
export async function listAllProductSlugs(): Promise<string[]> {
  return apiFetch<string[]>("/api/products/slugs");
}

type ReviewPage = {
  content: ProductReview[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
};

/** 상세 페이지 리뷰. 새 후기가 바로 보이도록 브라우저에서 다시 불러올 때 쓴다. */
export async function listProductReviews(
  slug: string,
  size = 10,
): Promise<{ reviews: ProductReview[]; total: number }> {
  const res = await apiFetch<ReviewPage>(
    `/api/products/${encodeURIComponent(slug)}/reviews?size=${size}`,
  );
  return { reviews: res.content, total: res.page.totalElements };
}
