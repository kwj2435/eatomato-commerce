import { Container } from "@/components/layout/Container";
import { listProducts, normalizeSort } from "@/lib/api/products";
import type { SubcategoryKey } from "@/types/product";

import { CategoryTabs } from "./CategoryTabs";
import { ProductListCard } from "./ProductListCard";
import { SortSelect } from "./SortSelect";
import type { CategoryEntry } from "./categories";

type ProductListViewProps = {
  category: CategoryEntry;
  activeSubcategory: SubcategoryKey | null;
  /** URL 쿼리에서 넘어온 raw sort 값. 이 컴포넌트가 정규화 책임을 진다. */
  rawSort: string | undefined;
};

/**
 * 상품 리스트 뷰.
 * 라우트마다 얇은 page.tsx 하나가 이 컴포넌트에 위임한다.
 *
 * 서버 컴포넌트로 두어 초기 진입 시 정렬된 상품 목록이 이미 HTML 에 들어간다 → LCP 유리.
 * 정렬 UI 만 클라이언트(URL 갱신 트리거)로 분리했다.
 */
export async function ProductListView({
  category,
  activeSubcategory,
  rawSort,
}: ProductListViewProps) {
  const sort = normalizeSort(rawSort);
  const products = await listProducts({
    category: category.slug,
    subcategory: activeSubcategory ?? undefined,
    sort,
  });

  return (
    <>
      <Container as="section" className="pt-14">
        <CategoryTabs category={category} activeSubcategory={activeSubcategory} />
      </Container>

      <Container className="mt-[86px] flex justify-end">
        <SortSelect currentSort={sort} />
      </Container>

      <Container as="section" className="mt-3.5" aria-label="상품 목록">
        {products.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-3">
            {products.map((product) => (
              <li key={product.id}>
                <ProductListCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <p className="text-[15px] text-ink-muted">
        해당 조건의 상품이 아직 준비되지 않았습니다.
      </p>
    </div>
  );
}
