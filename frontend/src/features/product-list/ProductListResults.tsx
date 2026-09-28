"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { Container } from "@/components/layout/Container";
import { normalizeSort, sortProducts } from "@/lib/utils/product-filter";
import type { Product } from "@/types/product";

import { ProductGrid } from "./ProductGrid";
import { SortSelect } from "./SortSelect";

type ProductListResultsProps = {
  /** 카테고리로 걸러진 상품 전체. 정렬은 이 컴포넌트가 클라이언트에서 수행한다. */
  products: Product[];
};

/**
 * 상품 목록의 정렬 + 그리드 (하이드레이션 이후).
 *
 * 정렬을 서버가 아니라 클라이언트에서 수행하는 이유:
 * 정적 배포(`output: "export"`)에서는 서버가 `searchParams` 를 읽을 수 없다.
 * 카테고리별 상품 수가 적어 클라이언트 정렬 비용은 무시할 수준이다.
 *
 * 실 API 를 붙여 서버 렌더로 돌아갈 때는 이 컴포넌트를 걷어내고
 * 서버에서 `listProducts({ sort })` 를 호출하면 된다.
 */
export function ProductListResults({ products }: ProductListResultsProps) {
  const searchParams = useSearchParams();
  const sort = normalizeSort(searchParams.get("sort"));

  const sorted = useMemo(() => sortProducts(products, sort), [products, sort]);

  return (
    <>
      <Container className="mt-[86px] flex justify-end">
        <SortSelect currentSort={sort} />
      </Container>

      <Container as="section" className="mt-3.5">
        <ProductGrid products={sorted} label="상품 목록" />
      </Container>
    </>
  );
}
