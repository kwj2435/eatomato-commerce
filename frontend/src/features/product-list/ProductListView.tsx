import { Suspense } from "react";

import { Container } from "@/components/layout/Container";
import { listProducts } from "@/lib/api/products";
import { DEFAULT_SORT, sortProducts } from "@/lib/utils/product-filter";
import type { SubcategoryKey } from "@/types/product";

import { CategoryTabs } from "./CategoryTabs";
import { ProductGrid } from "./ProductGrid";
import { ProductListResults } from "./ProductListResults";
import { SortSelect } from "./SortSelect";
import type { CategoryEntry } from "./categories";

type ProductListViewProps = {
  category: CategoryEntry;
  activeSubcategory: SubcategoryKey | null;
};

/**
 * 상품 리스트 뷰.
 * 라우트마다 얇은 page.tsx 하나가 이 컴포넌트에 위임한다.
 *
 * 서버 컴포넌트로 두어 초기 진입 시 상품 목록이 이미 HTML 에 들어간다 → LCP 유리.
 * 정렬은 URL 쿼리에 의존하므로 정적 생성이 가능하도록 클라이언트(ProductListResults)로 넘긴다.
 *
 * Suspense 가 필요한 이유:
 * `useSearchParams()` 는 프리렌더 시점에 쿼리를 알 수 없어 클라이언트 렌더로 넘어간다.
 * 경계를 두지 않으면 페이지 전체가 정적 생성에서 빠지므로, 결과 영역만 경계 안에 둔다.
 *
 * fallback 이 스켈레톤이 아니라 "기본 정렬 화면" 인 이유:
 * Suspense fallback 이 그대로 정적 HTML 이 되므로, 스켈레톤을 두면 모든 방문자가
 * 하이드레이션 전까지 빈 화면을 보게 된다. 기본 정렬 결과를 렌더링해 두면
 * 정적 HTML 에 실제 상품이 담기고, 쿼리가 기본값이면 하이드레이션 후에도 화면이 그대로다.
 */
export async function ProductListView({
  category,
  activeSubcategory,
}: ProductListViewProps) {
  const products = await listProducts({
    category: category.slug,
    subcategory: activeSubcategory ?? undefined,
  });

  return (
    <>
      <Container as="section" className="pt-14">
        <CategoryTabs category={category} activeSubcategory={activeSubcategory} />
      </Container>

      <Suspense
        fallback={
          <>
            <Container className="mt-[86px] flex justify-end">
              <SortSelect currentSort={DEFAULT_SORT} />
            </Container>
            <Container as="section" className="mt-3.5">
              <ProductGrid
                products={sortProducts(products, DEFAULT_SORT)}
                label="상품 목록"
              />
            </Container>
          </>
        }
      >
        <ProductListResults products={products} />
      </Suspense>
    </>
  );
}
