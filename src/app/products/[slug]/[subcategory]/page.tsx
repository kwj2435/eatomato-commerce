import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteFrame } from "@/components/layout/SiteFrame";
import {
  CATEGORY_LIST,
  resolveCategory,
} from "@/features/product-list/categories";
import { ProductListView } from "@/features/product-list/ProductListView";

/**
 * `/products/[slug]/[subcategory]` — 카테고리 + 서브카테고리 필터 리스트.
 *
 * 부모 `[slug]` 가 카테고리·상품 겸용이므로, 두 세그먼트인 경우는 무조건 카테고리 리스트다.
 * 여기서는 `slug` 를 카테고리로만 해석하며, 상품이라면 404.
 */

type RouteParams = { slug: string; subcategory: string };
type PageProps = {
  params: Promise<RouteParams>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams(): Promise<RouteParams[]> {
  return CATEGORY_LIST.flatMap((category) =>
    category.subcategories
      .filter((sub) => sub.slug !== null)
      .map((sub) => ({ slug: category.slug, subcategory: sub.slug! })),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, subcategory } = await params;
  const resolved = resolveCategory(slug, subcategory);
  if (!resolved) return { title: "상품을 찾을 수 없습니다" };
  return {
    title: `${resolved.category.label} · ${resolved.subcategory.label}`,
  };
}

export default async function ProductSubcategoryPage({
  params,
  searchParams,
}: PageProps) {
  const [{ slug, subcategory }, sp] = await Promise.all([params, searchParams]);

  const resolved = resolveCategory(slug, subcategory);
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
