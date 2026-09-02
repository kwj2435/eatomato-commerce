import type { CategoryKey, SubcategoryKey } from "@/types/product";

/**
 * 카테고리 · 서브카테고리 정의.
 *
 * 이 파일 하나가 GNB 드롭다운, 상품 리스트 페이지의 탭, 라우트 파라미터 검증까지
 * 전부의 단일 진실 원천(single source of truth) 이 된다.
 * 새 카테고리를 추가하려면 여기서만 손보면 되고, 나머지는 타입이 강제해 실수를 잡아낸다.
 */

export type SubcategoryEntry = {
  /** URL 세그먼트. `null` 이면 "전체(All)" 를 의미하고 URL 에는 세그먼트를 생략한다. */
  slug: SubcategoryKey | null;
  label: string;
};

export type CategoryEntry = {
  slug: CategoryKey;
  label: string;
  /** 상품 리스트 상단 탭. 항상 첫 항목이 "All" 이라고 가정한다. */
  subcategories: SubcategoryEntry[];
};

export const CATEGORIES: Record<CategoryKey, CategoryEntry> = {
  "phone-case": {
    slug: "phone-case",
    label: "Phone Case",
    subcategories: [
      { slug: null, label: "All" },
      { slug: "epoxy-glass", label: "Epoxy & Glass" },
      { slug: "clear-jelly", label: "Clear Jelly Hard" },
    ],
  },
  "phone-acc": {
    slug: "phone-acc",
    label: "Phone ACC",
    subcategories: [
      { slug: null, label: "All" },
      { slug: "tok", label: "Tok" },
      { slug: "card-wallet", label: "Card Wallet" },
      { slug: "airpods-case", label: "Airpods Case" },
    ],
  },
};

/**
 * 카테고리 순서를 보존한 배열 뷰. GNB 렌더링·라우트 정적 생성에 사용된다.
 * `Object.values(CATEGORIES)` 를 그대로 쓸 수도 있으나, JS 엔진에 따라 순서가
 * 삽입 순서가 아닐 수 있으므로 명시적으로 배열을 정의한다.
 */
export const CATEGORY_LIST: CategoryEntry[] = [
  CATEGORIES["phone-case"],
  CATEGORIES["phone-acc"],
];

/** 카테고리 · 서브카테고리 조합이 유효한지 확인한다. 유효하지 않으면 `null`. */
export function resolveCategory(
  categorySlug: string,
  subcategorySlug?: string,
): { category: CategoryEntry; subcategory: SubcategoryEntry } | null {
  const category = CATEGORIES[categorySlug as CategoryKey];
  if (!category) return null;

  if (!subcategorySlug) {
    const all = category.subcategories.find((s) => s.slug === null);
    return all ? { category, subcategory: all } : null;
  }

  const subcategory = category.subcategories.find(
    (s) => s.slug === subcategorySlug,
  );
  if (!subcategory) return null;

  return { category, subcategory };
}

/**
 * 카테고리/서브카테고리 조합을 URL 경로로 직렬화한다.
 * GNB, 탭 링크에서 이 헬퍼만 쓰면 URL 규칙이 한 곳에 모인다.
 */
export function categoryHref(
  categorySlug: CategoryKey,
  subcategorySlug?: SubcategoryKey | null,
): string {
  return subcategorySlug
    ? `/products/${categorySlug}/${subcategorySlug}`
    : `/products/${categorySlug}`;
}
