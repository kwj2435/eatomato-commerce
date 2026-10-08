import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { MultilineText } from "@/components/ui/MultilineText";
import { listHeroBanners } from "@/lib/api/banners";
import { cn } from "@/lib/utils/cn";

/**
 * "Special" 섹션. 관리자가 올린 혜택 배너(배너 관리 > Special)를 세 장씩 보인다.
 * 세 번째 칸은 두 배 너비(시안: 세로형 2장 + 가로형 1장). 누르면 공지(기본 /notice)로 간다.
 */
/** @param description 섹션 설명. 관리자 화면(문구)에서 고친다. 비어 있으면 설명 줄을 그리지 않는다. */
export async function SpecialSection({ description }: { description: string }) {
  const banners = await listHeroBanners("SPECIAL");

  return (
    <section aria-labelledby="special-title" className="pt-14 md:pt-[94px]">
      <Container>
        <h2 id="special-title" className="text-[22px] font-medium tracking-[-0.2px] text-black md:text-[25px]">
          Special
        </h2>
        {description ? (
          <p className="mt-4 text-[14px] font-normal leading-[22px] tracking-[-0.3px] text-ink-muted md:mt-[39px] md:text-[17.5px] md:leading-[25.1px]">
            <MultilineText text={description} />
          </p>
        ) : null}

        <ul className="mt-8 grid grid-cols-2 gap-[13px] md:mt-[66px] md:grid-cols-4 md:gap-4">
          {banners.length === 0
            ? Array.from({ length: 3 }, (_, i) => (
                <li key={i} aria-hidden className={cn(tileClass(i), "flex items-center justify-center bg-surface-elevated")}>
                  <span className="text-[16px] text-ink-placeholder md:text-[20px]">혜택 배너</span>
                </li>
              ))
            : banners.map((banner, i) => (
                <li key={banner.id} className={tileClass(i)}>
                  <Link
                    href={banner.href ?? "/notice"}
                    aria-label={banner.alt}
                    className="group relative block h-full w-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                  >
                    {banner.imageUrl ? (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.alt}
                        fill
                        sizes={i % 3 === 2 ? "(min-width: 1200px) 600px, (min-width: 768px) 50vw, 100vw" : "(min-width: 1200px) 300px, (min-width: 768px) 25vw, 50vw"}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : null}
                  </Link>
                </li>
              ))}
        </ul>
      </Container>
    </section>
  );
}

/** 세 장마다 세 번째는 두 칸 차지. 세로형 칸이 줄 높이를 정하고 넓은 칸은 그 높이에 맞춘다. */
function tileClass(i: number) {
  return i % 3 === 2 ? "relative col-span-2 aspect-[4/3] md:aspect-auto" : "relative aspect-[2/3]";
}
