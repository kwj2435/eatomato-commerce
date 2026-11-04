import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { AboutContent, type AboutCategoryCard } from "@/features/about/AboutContent";
import { CATEGORIES, categoryHref } from "@/features/product-list/categories";
import { listProducts } from "@/lib/api/products";
import { getSiteContents } from "@/lib/api/site-content";
import type { CategoryKey } from "@/types/product";

export const metadata: Metadata = {
  title: "About",
  description: "eatomato 브랜드 소개 — 감각적인 데일리 굿즈 이야기",
};

/** "잇토마토가 만드는 것" 에 보여 줄 카테고리. 대표 이미지는 각 카테고리의 첫 상품 사진이다. */
const ABOUT_CATEGORIES: CategoryKey[] = ["phone-case", "phone-acc", "set"];

/** 글·이미지는 관리자 화면(문구)에서 고친다. 서버가 60초마다 다시 받아 반영한다. */
export default async function AboutPage() {
  const [contents, categories] = await Promise.all([getSiteContents(), loadCategoryCards()]);
  return (
    <SiteFrame>
      <AboutContent
        slogan={contents.ABOUT_BOTTOM_TEXT}
        heroImageUrl={contents.ABOUT_IMAGE_URL}
        introText={contents.ABOUT_TOP_TEXT}
        storyImageUrl={contents.ABOUT_STORY_IMAGE_URL ?? ""}
        categories={categories}
      />
    </SiteFrame>
  );
}

/** 카테고리 상품을 못 불러와도 About 은 열려야 하므로, 실패한 카테고리는 이미지 없이 둔다. */
async function loadCategoryCards(): Promise<AboutCategoryCard[]> {
  return Promise.all(
    ABOUT_CATEGORIES.map(async (key) => {
      const products = await listProducts({ category: key }).catch(() => []);
      return {
        label: CATEGORIES[key].label,
        href: categoryHref(key),
        imageUrl: products.find((p) => p.imageUrl)?.imageUrl,
      };
    }),
  );
}
