"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { Container } from "@/components/layout/Container";
import { ProductListCard } from "@/features/product-list/ProductListCard";
import { SortSelect } from "@/features/product-list/SortSelect";
import {
  matchesQuery,
  normalizeSort,
  sortProducts,
} from "@/lib/utils/product-filter";
import type { Product } from "@/types/product";

import { SearchInput } from "./SearchInput";

type SearchResultsProps = {
  /** 검색 대상 상품 전체. 필터·정렬은 이 컴포넌트가 클라이언트에서 수행한다. */
  products: Product[];
};

/**
 * 검색 입력 + 결과.
 *
 * 검색·정렬을 클라이언트에서 수행하는 이유:
 * 정적 배포(`output: "export"`)에서는 서버가 `searchParams` 를 읽을 수 없다.
 * mock 상품 수가 적어 전량을 내려도 부담이 없다.
 *
 * 화면 상태는 셋으로 나뉜다:
 * - 검색어 없음  → 안내 문구 (결과 0건과 구분해야 한다)
 * - 결과 0건     → 검색어를 되짚어주는 문구 + 전체 상품 이동 CTA
 * - 결과 있음    → 건수 + 정렬 + 그리드
 */
export function SearchResults({ products }: SearchResultsProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const sort = normalizeSort(searchParams.get("sort"));

  const results = useMemo(() => {
    const keyword = query.toLowerCase();
    if (!keyword) return [];
    return sortProducts(
      products.filter((p) => matchesQuery(p, keyword)),
      sort,
    );
  }, [products, query, sort]);

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
      ) : results.length === 0 ? (
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
              총 <strong className="font-bold text-black">{results.length}</strong>
              건
            </p>
            <SortSelect currentSort={sort} />
          </Container>

          <Container as="section" className="mt-3.5" aria-label="검색 결과">
            <ul className="grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-3">
              {results.map((product) => (
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
