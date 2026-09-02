import Link from "next/link";

import { cn } from "@/lib/utils/cn";
import type { SubcategoryKey } from "@/types/product";

import type { CategoryEntry } from "./categories";
import { categoryHref } from "./categories";

type CategoryTabsProps = {
  category: CategoryEntry;
  /** 현재 활성 서브카테고리. `null` 이면 "All" 이 활성. */
  activeSubcategory: SubcategoryKey | null;
};

/**
 * 상품 리스트 상단의 서브카테고리 탭.
 * 각 탭은 URL 을 바꾸는 링크 → 서버 컴포넌트로 두어도 충분하고, 뒤로가기·SEO 에도 유리하다.
 */
export function CategoryTabs({ category, activeSubcategory }: CategoryTabsProps) {
  return (
    <nav
      aria-label={`${category.label} 서브카테고리`}
      className="mt-14 flex flex-wrap items-center justify-center gap-6 md:gap-[93px]"
    >
      {category.subcategories.map((sub) => {
        const isActive = sub.slug === activeSubcategory;
        return (
          <Link
            key={sub.slug ?? "all"}
            href={categoryHref(category.slug, sub.slug)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "text-[21px] font-normal leading-6 tracking-[-0.4px] text-brand-secondary transition-colors",
              isActive
                ? "rounded-full bg-brand-highlight px-3.5 py-1"
                : "hover:text-brand-primary",
            )}
          >
            {sub.label}
          </Link>
        );
      })}
    </nav>
  );
}
