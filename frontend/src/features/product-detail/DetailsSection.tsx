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
    <Container as="section" id="details" className="scroll-mt-24 pt-[100px] md:pt-[180px]">
      <h2 className="text-center text-[17px] font-normal tracking-[1.2px] text-brand-secondary md:text-[20px] md:tracking-[1.4px]">
        DETAILS
      </h2>

      <div className="mt-[38px] flex flex-col gap-[30px] md:gap-[125px]">
        {images.map((src, i) => (
          <div
            key={src + i}
            className="relative aspect-[4/5] w-full overflow-hidden border border-[#B0AAA9]"
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
    </Container>
  );
}
