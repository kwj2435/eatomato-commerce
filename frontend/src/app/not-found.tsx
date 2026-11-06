import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { ProductCard } from "@/components/product/ProductCard";
import { listBestProducts } from "@/lib/api/products";
import type { Product } from "@/types/product";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  robots: { index: false },
};

/**
 * 없는 주소·판매 끝난 상품 링크로 들어온 손님을 다시 상품으로 안내한다(제안서 07).
 * 예전에 인스타그램·카카오톡에 공유된 링크로 생각보다 자주 들어온다.
 * 추천 상품을 못 받아도(백엔드 오류) 안내와 버튼은 그대로 보인다.
 */
export default async function NotFound() {
  const products: Product[] = await listBestProducts({ limit: 4 }).catch(() => []);

  return (
    <SiteFrame>
      <Container as="section" className="flex flex-col items-center pt-16 text-center md:pt-24">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-highlight font-serif text-[20px] text-brand-primary md:h-20 md:w-20 md:text-[24px]">
          404
        </span>
        <h1 className="mt-6 text-[20px] font-semibold tracking-[-0.4px] text-black md:text-[26px]">찾으시는 페이지가 없어요</h1>
        <p className="mt-3 text-[13px] leading-[21px] tracking-[-0.3px] text-ink-muted md:text-[15px] md:leading-[24px]">
          주소가 바뀌었거나 판매가 끝난 상품일 수 있어요.
          <br />
          아래 상품을 둘러보시거나 홈으로 이동해 주세요.
        </p>
        <div className="mt-7 flex w-full max-w-[360px] gap-2">
          <Link
            href="/"
            className="inline-flex h-12 flex-1 items-center justify-center bg-black text-[14px] font-medium text-white transition-colors hover:bg-brand-secondary"
          >
            홈으로 가기
          </Link>
          <Link
            href="/#best-picks-title"
            className="inline-flex h-12 flex-1 items-center justify-center border border-black text-[14px] font-medium text-black transition-colors hover:bg-black hover:text-white"
          >
            베스트 상품 보기
          </Link>
        </div>
      </Container>

      {products.length > 0 ? (
        <Container as="section" aria-labelledby="not-found-picks" className="pb-6 pt-16 md:pt-24">
          <h2 id="not-found-picks" className="text-[18px] font-semibold tracking-[-0.3px] text-black md:text-[22px]">
            이런 상품은 어떠세요?
          </h2>
          <ul className="mt-5 grid grid-cols-2 gap-[13px] md:mt-8 md:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </Container>
      ) : null}
    </SiteFrame>
  );
}
