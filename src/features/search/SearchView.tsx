import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { ProductListCard } from "@/features/product-list/ProductListCard";
import { SortSelect } from "@/features/product-list/SortSelect";
import { normalizeSort, searchProducts } from "@/lib/api/products";

import { SearchInput } from "./SearchInput";

type SearchViewProps = {
  /** URL 쿼리에서 넘어온 raw 검색어. */
  rawQuery: string | undefined;
  /** URL 쿼리에서 넘어온 raw 정렬값. 정규화는 이 컴포넌트가 책임진다. */
  rawSort: string | undefined;
};

/**
 * 상품 검색 결과 뷰.
 *
 * 시안에 검색 화면은 없다. 헤더의 검색 아이콘이 가리키던 `/search` 가 404 였기 때문에,
 * 상품 리스트 페이지(4p)의 구성 요소 — 정렬 셀렉트, 상품 카드 그리드, 빈 상태 —
 * 를 그대로 재사용해 시안과 이질감이 없도록 만들었다.
 *
 * 서버 컴포넌트로 두어 검색 결과가 초기 HTML 에 포함된다. 입력만 client 로 분리했다.
 *
 * 화면 상태는 셋으로 나뉜다:
 * - 검색어 없음  → 안내 문구 (결과 0건과 구분해야 한다)
 * - 결과 0건     → 검색어를 되짚어주는 문구 + 카테고리 이동 CTA
 * - 결과 있음    → 건수 + 정렬 + 그리드
 */
export async function SearchView({ rawQuery, rawSort }: SearchViewProps) {
  const query = rawQuery?.trim() ?? "";
  const sort = normalizeSort(rawSort);
  const products = await searchProducts({ query, sort });

  return (
    <>
      <Container as="section" className="pt-14">
        <h1 className="text-center text-[21px] font-normal leading-6 tracking-[-0.4px] text-brand-secondary">
          검색
        </h1>
        <div className="mt-8">
          {/* key: URL 검색어가 바뀌면 입력 상태를 새 값으로 다시 마운트한다(뒤로가기 대응). */}
          <SearchInput key={query} currentQuery={query} />
        </div>
      </Container>

      {!query ? (
        <Container className="mt-[86px]">
          <Message>찾으시는 상품명을 입력해 주세요.</Message>
        </Container>
      ) : products.length === 0 ? (
        <Container className="mt-[86px]">
          <Message>
            <strong className="font-bold">&lsquo;{query}&rsquo;</strong> 에 대한
            검색 결과가 없습니다.
          </Message>
          <div className="mt-8 flex justify-center">
            <Link
              href="/products/phone-case"
              className="inline-flex h-[52px] items-center justify-center border-[1.5px] border-black px-8 text-[15px] font-medium transition-colors hover:bg-black hover:text-white"
            >
              전체 상품 보기
            </Link>
          </div>
        </Container>
      ) : (
        <>
          <Container className="mt-[86px] flex items-center justify-between">
            <p className="text-[15px] tracking-[-0.2px] text-ink-muted">
              총 <strong className="font-bold text-black">{products.length}</strong>
              건
            </p>
            <SortSelect currentSort={sort} />
          </Container>

          <Container as="section" className="mt-3.5" aria-label="검색 결과">
            <ul className="grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-3">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductListCard product={product} />
                </li>
              ))}
            </ul>
          </Container>
        </>
      )}
    </>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex min-h-[200px] items-center justify-center text-center text-[15px] tracking-[-0.2px] text-ink-muted">
      {children}
    </p>
  );
}
