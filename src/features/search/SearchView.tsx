import { Suspense } from "react";

import { Container } from "@/components/layout/Container";
import { listSearchableProducts } from "@/lib/api/products";

import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";

/**
 * 상품 검색 뷰.
 *
 * 시안에 검색 화면은 없다. 헤더의 검색 아이콘이 가리키던 `/search` 가 404 였기 때문에,
 * 상품 리스트 페이지(4p)의 구성 요소 — 정렬 셀렉트, 상품 카드 그리드, 빈 상태 —
 * 를 그대로 재사용해 시안과 이질감이 없도록 만들었다.
 *
 * 서버는 검색 대상 목록만 준비하고, 검색어·정렬은 URL 쿼리에 의존하므로
 * 정적 생성이 가능하도록 클라이언트(SearchResults)가 처리한다.
 *
 * Suspense: `useSearchParams()` 를 쓰는 영역이 경계 안에 있어야 페이지가 정적으로 생성된다.
 * fallback 은 그대로 정적 HTML 이 되므로, 검색 전 기본 화면(입력 + 안내)을 그대로 렌더링한다.
 */
export async function SearchView() {
  const products = await listSearchableProducts();

  return (
    <Suspense fallback={<SearchIdle />}>
      <SearchResults products={products} />
    </Suspense>
  );
}

/** 검색어 없는 기본 화면. 정적 HTML 로 그대로 나가고, 하이드레이션 후 쿼리가 없으면 동일하다. */
function SearchIdle() {
  return (
    <>
      <Container as="section" className="pt-14">
        <h1 className="text-center text-[21px] font-normal leading-6 tracking-[-0.4px] text-brand-secondary">
          검색
        </h1>
        <div className="mt-8">
          <SearchInput currentQuery="" />
        </div>
      </Container>
      <Container className="mt-[86px]">
        <p className="flex min-h-[200px] items-center justify-center text-center text-[15px] tracking-[-0.2px] text-ink-muted">
          찾으시는 상품명을 입력해 주세요.
        </p>
      </Container>
    </>
  );
}
