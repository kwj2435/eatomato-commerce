import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteFrame } from "@/components/layout/SiteFrame";
import {
  CATEGORY_LIST,
  resolveCategory,
} from "@/features/product-list/categories";
import { ProductListView } from "@/features/product-list/ProductListView";
import { ProductDetailView } from "@/features/product-detail/ProductDetailView";
import {
  getProductDetail,
  listAllProductSlugs,
} from "@/lib/api/products";

/**
 * `/products/[slug]` — 카테고리 전체 리스트 OR 개별 상품 상세.
 *
 * 슬러그 스페이스가 겹치지 않도록 규칙을 강제한다:
 * - 카테고리 슬러그는 `CATEGORIES` 에 등록된 값 (`phone-case`, `phone-acc`) 만 허용.
 * - 상품 슬러그는 그 외 값. mock 데이터에서 카테고리와 이름 충돌이 없도록 유지.
 *
 * 하나의 라우트가 두 화면을 담당하도록 한 이유:
 * - 시안이 `/products/{category}` 와 `/products/{productSlug}` 를 동일 prefix 로 요구한다.
 * - Next.js 는 같은 depth 에 두 개의 dynamic segment 폴더를 허용하지 않는다.
 * - 결과적으로 slug 를 먼저 카테고리로 시도하고, 아니면 상품으로 시도하는 "디스패치 라우트" 가 자연스러운 해법이다.
 * - GNB · 상품 카드 · 카트 등 기존 링크(`/products/phone-case`, `/products/mellow-macsafe`) 도 그대로 유효하다.
 */

type RouteParams = { slug: string };
type PageProps = {
  params: Promise<RouteParams>;
};

export async function generateStaticParams(): Promise<RouteParams[]> {
  const categorySlugs = CATEGORY_LIST.map((c) => ({ slug: c.slug }));
  const productSlugs = (await listAllProductSlugs()).map((slug) => ({ slug }));
  return [...categorySlugs, ...productSlugs];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const asCategory = resolveCategory(slug);
  if (asCategory) return { title: asCategory.category.label };

  const product = await getProductDetail(slug);
  if (product) return { title: product.name, description: product.noticeLines[0] };

  return { title: "상품을 찾을 수 없습니다" };
}

export default async function ProductRoute({ params }: PageProps) {
  const { slug } = await params;

  // 1) 카테고리 슬러그면 → 리스트 뷰(전체)
  const asCategory = resolveCategory(slug);
  if (asCategory) {
    return (
      <SiteFrame>
        <ProductListView
          category={asCategory.category}
          activeSubcategory={null}
        />
      </SiteFrame>
    );
  }

  // 2) 상품 슬러그면 → 상세 뷰
  const product = await getProductDetail(slug);
  if (product) {
    return (
      <SiteFrame>
        <ProductDetailView product={product} />
      </SiteFrame>
    );
  }

  // 3) 어느 쪽도 아니면 404
  notFound();
}
