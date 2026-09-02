import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteFrame } from "@/components/layout/SiteFrame";
import {
  CATEGORY_LIST,
  resolveCategory,
} from "@/features/product-list/categories";
import { ProductListView } from "@/features/product-list/ProductListView";

/**
 * 상품 리스트 라우트.
 *
 * `/products/phone-case`             → 카테고리 전체
 * `/products/phone-case/epoxy-glass` → 서브카테고리 필터
 *
 * optional catch-all(`[[...subcategory]]`)로 두 경우를 하나의 파일에서 처리한다.
 * 잘못된 카테고리/서브카테고리는 `notFound()` 로 404 를 반환한다.
 */

type RouteParams = {
  category: string;
  subcategory?: string[];
};

type PageProps = {
  params: Promise<RouteParams>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * 정적 파라미터 생성.
 * 빌드 시 유효한 카테고리·서브카테고리 조합을 미리 렌더링해 초기 진입을 빠르게 한다.
 * "전체" 는 subcategory 를 undefined 로 둔다(옵셔널 catch-all 규약).
 */
export function generateStaticParams(): RouteParams[] {
  return CATEGORY_LIST.flatMap((category) =>
    category.subcategories.map((sub) => ({
      category: category.slug,
      ...(sub.slug ? { subcategory: [sub.slug] } : {}),
    })),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, subcategory } = await params;
  const resolved = resolveCategory(category, subcategory?.[0]);
  if (!resolved) return { title: "상품" };

  const suffix =
    resolved.subcategory.slug === null ? "" : ` · ${resolved.subcategory.label}`;
  return { title: `${resolved.category.label}${suffix}` };
}

export default async function ProductListPage({ params, searchParams }: PageProps) {
  const [{ category, subcategory }, sp] = await Promise.all([
    params,
    searchParams,
  ]);

  const resolved = resolveCategory(category, subcategory?.[0]);
  if (!resolved) notFound();

  const rawSort = typeof sp.sort === "string" ? sp.sort : undefined;

  return (
    <SiteFrame>
      <ProductListView
        category={resolved.category}
        activeSubcategory={resolved.subcategory.slug}
        rawSort={rawSort}
      />
    </SiteFrame>
  );
}
