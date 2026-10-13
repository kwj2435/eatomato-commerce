import Image from "next/image";

import { Container } from "@/components/layout/Container";
import { MultilineText } from "@/components/ui/MultilineText";

/**
 * About 페이지 본문.
 *
 * 시안 4p 구조: 상단 텍스트 → 풀블리드 이미지 → 하단 텍스트.
 * 글과 이미지는 관리자 화면(문구)에서 고친다(ABOUT_TOP_TEXT · ABOUT_IMAGE_URL · ABOUT_BOTTOM_TEXT).
 * 글은 빈 줄로 문단을 나누고, 문단 안의 줄바꿈은 그대로 보인다. 비워 둔 블록은 그리지 않는다.
 */
export function AboutContent({
  topText,
  imageUrl,
  bottomText,
}: {
  topText: string;
  imageUrl: string;
  bottomText: string;
}) {
  return (
    <>
      {topText.trim() ? (
        <Container as="section" aria-label="브랜드 소개 서두" className="pb-[65px] pt-[104px]">
          <AboutTextBlock text={topText} />
        </Container>
      ) : null}

      {imageUrl.trim() ? (
        <section
          aria-label="브랜드 비주얼"
          className="relative flex h-[520px] w-full items-center justify-center overflow-hidden bg-surface-hero md:h-[900px] lg:h-[1430px]"
        >
          <Image src={imageUrl.trim()} alt="eatomato 브랜드 비주얼" fill priority sizes="100vw" className="object-cover" />
        </section>
      ) : null}

      {bottomText.trim() ? (
        <Container as="section" aria-label="브랜드 소개 결말" className="pb-[148px] pt-[74px]">
          <AboutTextBlock text={bottomText} />
        </Container>
      ) : null}
    </>
  );
}

function AboutTextBlock({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="flex w-full max-w-[760px] flex-col gap-[26px]">
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="text-[15px] font-normal leading-[1.7] tracking-[-0.2px] text-black">
          <MultilineText text={paragraph} />
        </p>
      ))}
    </div>
  );
}
