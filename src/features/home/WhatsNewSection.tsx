import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/product/ProductCard";
import { listNewProducts } from "@/lib/api/products";

/**
 * "What's New" 섹션.
 *
 * 서버 컴포넌트: `listNewProducts()` 를 직접 await 로 호출한다.
 * - 클라이언트 번들에 API 코드가 포함되지 않음
 * - 데이터가 준비된 상태에서 HTML 이 스트리밍됨 → 초기 화면이 즉시 채워진다
 *
 * 인터랙션이 없으므로 클라이언트 컴포넌트로 나눌 이유가 없다.
 */
export async function WhatsNewSection() {
  const products = await listNewProducts({ limit: 4 });

  return (
    <section aria-labelledby="whats-new-title" className="pt-[59px]">
      <Container>
        <h2
          id="whats-new-title"
          className="text-[25px] font-medium tracking-[-0.2px] text-black"
        >
          What&rsquo;s New
        </h2>
        <p className="mt-[39px] text-[17.5px] font-normal leading-[25.1px] tracking-[-0.3px] text-ink-muted">
          일상에 신선한 감각을 더해줄 신제품 컬렉션.
          <br />
          갓 채집한 듯 다채로운 그래픽으로 새로운 기분을 선사합니다.
        </p>

        <ul className="mt-[66px] grid grid-cols-2 gap-[13px] md:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
