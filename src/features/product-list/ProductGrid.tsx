import type { Product } from "@/types/product";

import { ProductListCard } from "./ProductListCard";

/**
 * 상품 카드 그리드.
 *
 * 서버(Suspense fallback)와 클라이언트(정렬 결과) 양쪽에서 같은 마크업을 쓰기 위해
 * 상태 없는 표현 컴포넌트로 분리했다. 덕분에 기본 정렬 화면이 정적 HTML 에 그대로 들어가고,
 * 하이드레이션 후 정렬이 바뀔 때만 다시 그려진다.
 */
export function ProductGrid({
  products,
  label,
}: {
  products: Product[];
  label: string;
}) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-[15px] text-ink-muted">
          해당 조건의 상품이 아직 준비되지 않았습니다.
        </p>
      </div>
    );
  }

  return (
    <ul aria-label={label} className="grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-3">
      {products.map((product) => (
        <li key={product.id}>
          <ProductListCard product={product} />
        </li>
      ))}
    </ul>
  );
}
