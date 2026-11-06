import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/product/ProductCard";
import { listNewProducts } from "@/lib/api/products";

import { PlaceholderGrid } from "./PlaceholderGrid";
import { SectionHeading } from "./SectionHeading";

/**
 * "What's New" 섹션.
 *
 * 서버 컴포넌트: `listNewProducts()` 를 직접 await 로 호출한다.
 * - 클라이언트 번들에 API 코드가 포함되지 않음
 * - 데이터가 준비된 상태에서 HTML 이 스트리밍됨 → 초기 화면이 즉시 채워진다
 *
 * 인터랙션이 없으므로 클라이언트 컴포넌트로 나눌 이유가 없다.
 */
/** @param description 섹션 설명. 관리자 화면(문구)에서 고친다. 비어 있으면 설명 줄을 그리지 않는다. */
export async function WhatsNewSection({ description }: { description: string }) {
  const products = await listNewProducts({ limit: 4 });

  return (
    <section aria-labelledby="whats-new-title" className="pt-[59px]">
      <Container>
        <SectionHeading id="whats-new-title" title="What’s New" description={description} moreHref="/products/phone-case" />

        {products.length === 0 ? (
          <PlaceholderGrid label="제품이미지" message="등록된 상품이 없습니다." />
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-[13px] md:mt-10 md:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
