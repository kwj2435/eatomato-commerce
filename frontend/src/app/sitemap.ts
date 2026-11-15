import type { MetadataRoute } from "next";

import { CATEGORY_LIST } from "@/features/product-list/categories";
import { listNotices } from "@/lib/api/notices";
import { listAllProductSlugs } from "@/lib/api/products";
import { SITE_URL } from "@/lib/site";

/** 상품이 추가·삭제되면 1시간 안에 반영한다. */
export const revalidate = 3600;

/**
 * 검색엔진에 제출하는 페이지 목록(네이버 서치어드바이저·구글 서치 콘솔).
 * 주소는 사이트 설정(trailingSlash)과 같게 끝에 / 를 붙인다.
 * 백엔드를 못 읽으면 고정 페이지만이라도 내보낸다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => `${SITE_URL}${path}`;
  const now = new Date();

  const fixed: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: url("/about/"), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/notice/"), changeFrequency: "weekly", priority: 0.4 },
  ];

  // 상단 메뉴에서 감춘 카테고리(상품이 아직 없거나 임시로 내린 것)는 검색엔진에도 알리지 않는다.
  const categories: MetadataRoute.Sitemap = CATEGORY_LIST.filter((category) => !category.hiddenInNav).flatMap((category) =>
    category.subcategories.map((sub) => ({
      url: url(sub.slug ? `/products/${category.slug}/${sub.slug}/` : `/products/${category.slug}/`),
      changeFrequency: "daily" as const,
      priority: sub.slug ? 0.7 : 0.8,
    })),
  );

  const [slugs, notices] = await Promise.all([
    listAllProductSlugs().catch(() => [] as string[]),
    listNotices().catch(() => []),
  ]);

  const products: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: url(`/products/${slug}/`),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const noticePages: MetadataRoute.Sitemap = notices.map((notice) => ({
    url: url(`/notice/${notice.id}/`),
    lastModified: notice.publishedAt ? new Date(notice.publishedAt) : undefined,
    changeFrequency: "monthly",
    priority: 0.3,
  }));

  return [...fixed, ...categories, ...products, ...noticePages];
}
