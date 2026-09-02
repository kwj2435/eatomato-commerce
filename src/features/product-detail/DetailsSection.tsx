import Image from "next/image";

import { Container } from "@/components/layout/Container";

type DetailsSectionProps = {
  images: string[];
};

/**
 * DETAILS 섹션.
 * 시안은 세로로 큰 상세 이미지(6~10장) 를 여러 장 나열한다.
 * scroll-margin 을 두어 앵커 이동 시 상단 헤더에 가려지지 않도록 한다.
 */
export function DetailsSection({ images }: DetailsSectionProps) {
  return (
    <Container as="section" id="details" className="scroll-mt-24 pt-[180px]">
      <h2 className="text-center text-[20px] font-normal tracking-[1.4px] text-brand-secondary">
        DETAILS
      </h2>

      <div className="mt-[38px] flex flex-col gap-[125px]">
        {images.map((src, i) => (
          <div
            key={src + i}
            className="relative aspect-[4/5] w-full overflow-hidden border border-[#B0AAA9] bg-white"
          >
            <Image
              src={src}
              alt={`상세 이미지 ${i + 1}`}
              fill
              sizes="(min-width: 1200px) 1200px, 100vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <div className="mt-[66px] flex flex-col items-center gap-3.5">
        {/* "더 보기" 페이지네이션 점 3개 — 시안 기준 정적 표기 */}
        <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-[#212121]" />
        <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-[#212121]" />
        <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-[#212121]" />
      </div>
    </Container>
  );
}
