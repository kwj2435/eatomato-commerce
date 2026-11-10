import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { PriceRow } from "@/components/product/PriceRow";
import { SoldOutOverlay } from "@/components/product/SoldOutOverlay";
import { listHeroBanners } from "@/lib/api/banners";
import { listBestProducts } from "@/lib/api/products";

import { BestPicksSlider } from "./BestPicksSlider";
import { MoreButton } from "./MoreButton";
import { SectionHeading } from "./SectionHeading";

/** Best Picks 의 "전체 보기"와, 링크를 비운 왼쪽 이미지가 가는 곳. */
const BEST_PICKS_HREF = "/products/phone-case";

/**
 * "Best Picks" 섹션.
 * 왼쪽: 관리자가 올린 이미지 슬라이드(배너 관리 > Best Picks). 누르면 배너 링크, 비어 있으면 휴대폰 케이스 목록으로 간다.
 * 오른쪽: BEST 배지를 단 상품 4개를 판매량 순으로. 사진 위에 1~4위 순위, 아래에 상품명·할인율·가격(제안서 02).
 * 누르면 상품 상세로 간다. 목록 아래에 "베스트 제품 전체 보기" 버튼을 둔다.
 */
/** @param description 섹션 설명. 관리자 화면(문구)에서 고친다. 비어 있으면 설명 줄을 그리지 않는다. */
export async function BestPicksSection({ description }: { description: string }) {
  const [images, products] = await Promise.all([listHeroBanners("BEST_PICK"), listBestProducts({ limit: 4 })]);

  return (
    <section aria-labelledby="best-picks-title" className="pt-14 md:pt-[94px]">
      <Container>
        <SectionHeading id="best-picks-title" title="Best Picks" description={description} moreHref={BEST_PICKS_HREF} />

        <div className="mt-6 grid gap-[13px] md:mt-10 md:grid-cols-2 md:gap-4">
          <BestPicksSlider images={images} fallbackHref={BEST_PICKS_HREF} />

          <ol className="grid grid-cols-2 gap-x-[13px] gap-y-5 md:gap-x-4 md:gap-y-6">
            {Array.from({ length: 4 }, (_, i) => {
              const product = products[i];
              if (!product) {
                return (
                  <li key={`empty-${i}`} aria-hidden className="flex aspect-square items-center justify-center border border-black/5">
                    <span className="text-[16px] text-ink-placeholder md:text-[20px]">제품이미지</span>
                  </li>
                );
              }
              const rank = i + 1;
              return (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.slug}`}
                    className="group flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                  >
                    <span className="relative flex aspect-square items-center justify-center overflow-hidden border border-black/5">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          sizes="(min-width: 1200px) 300px, (min-width: 768px) 25vw, 50vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-[16px] text-ink-placeholder md:text-[20px]">{product.name}</span>
                      )}
                      {product.soldOut ? <SoldOutOverlay /> : null}
                      <span className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-[12px] font-semibold text-white md:left-3 md:top-3 md:h-7 md:w-7 md:text-[13px]">
                        <span className="sr-only">판매 </span>
                        {rank}
                        <span className="sr-only">위</span>
                      </span>
                    </span>
                    <span className="mt-2.5 truncate text-[13px] font-medium leading-5 tracking-[-0.2px] text-black md:text-[14px]">
                      {product.name}
                    </span>
                    <PriceRow price={product.price} salePrice={product.salePrice} className="text-[12px] md:text-[13px]" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>

        <MoreButton href={BEST_PICKS_HREF} label="베스트 제품 전체 보기" />
      </Container>
    </section>
  );
}
