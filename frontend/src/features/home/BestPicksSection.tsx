import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { MultilineText } from "@/components/ui/MultilineText";
import { listHeroBanners } from "@/lib/api/banners";
import { listBestProducts } from "@/lib/api/products";

import { BestPicksSlider } from "./BestPicksSlider";

/**
 * "Best Picks" 섹션.
 * 왼쪽: 관리자가 올린 이미지 슬라이드(배너 관리 > Best Picks, 링크 없음).
 * 오른쪽: BEST 배지를 단 상품 4개. 누르면 상품 상세로 간다.
 */
/** @param description 섹션 설명. 관리자 화면(문구)에서 고친다. 비어 있으면 설명 줄을 그리지 않는다. */
export async function BestPicksSection({ description }: { description: string }) {
  const [images, products] = await Promise.all([listHeroBanners("BEST_PICK"), listBestProducts({ limit: 4 })]);

  return (
    <section aria-labelledby="best-picks-title" className="pt-14 md:pt-[94px]">
      <Container>
        <h2 id="best-picks-title" className="text-[22px] font-medium tracking-[-0.2px] text-black md:text-[25px]">
          Best Picks
        </h2>
        {description ? (
          <p className="mt-4 text-[14px] font-normal leading-[22px] tracking-[-0.3px] text-ink-muted md:mt-[39px] md:text-[17.5px] md:leading-[25.1px]">
            <MultilineText text={description} />
          </p>
        ) : null}

        <div className="mt-8 grid gap-[13px] md:mt-[66px] md:grid-cols-2 md:gap-4">
          <BestPicksSlider images={images} />

          <ul className="grid grid-cols-2 gap-[13px] md:gap-4">
            {Array.from({ length: 4 }, (_, i) => {
              const product = products[i];
              if (!product) {
                return (
                  <li key={`empty-${i}`} aria-hidden className="flex aspect-square items-center justify-center border border-black/5">
                    <span className="text-[16px] text-ink-placeholder md:text-[20px]">제품이미지</span>
                  </li>
                );
              }
              return (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.slug}`}
                    aria-label={product.name}
                    className="group relative flex aspect-square items-center justify-center overflow-hidden border border-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                  >
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
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}
