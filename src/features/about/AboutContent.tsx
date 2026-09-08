import Image from "next/image";

import { Container } from "@/components/layout/Container";
import { tomatoImage } from "@/lib/mock/tomato-images";

/**
 * About 페이지 본문.
 *
 * 시안 4p 구조: 상단 텍스트 → 풀블리드 이미지(Help FAB) → 하단 텍스트.
 * 문단은 상단/하단이 동일하므로 단일 소스(`ABOUT_PARAGRAPHS`)에서 두 번 렌더한다.
 * 이미지가 도착하기 전에는 mock 헬퍼로 붙여 두고, 실제로는 CMS/에셋으로 교체 대상.
 */

const ABOUT_PARAGRAPHS = [
  "국가는 노인과 청소년의 복지향상을 위한 정책을 실시할 의무를 진다. 언론·출판에 대한 허가나 검열과 집회·결사에 대한 허가는 인정되지 아니한다. 학교교육 및 평생교육을 포함한 교육제도와 그 운영, 교육재정 및 교원의 지위에 관한 기본적인 사항은 법률로 정한다.",
  "신체장애자 및 질병·노령 기타의 사유로 생활능력이 없는 국민은 법률이 정하는 바에 의하여 국가의 보호를 받는다. 대통령은 제3항과 제4항의 사유를 지체없이 공포하여야 한다.",
  "원장은 국회의 동의를 얻어 대통령이 임명하고, 그 임기는 4년으로 하며, 1차에 한하여 중임할 수 있다. 모든 국민은 근로의 권리를 가진다. 국가는 사회적·경제적 방법으로 근로자의 고용의 증진과 적정임금의 보장에 노력하여야 하며, 법률이 정하는 바에 의하여 최저임금제를 시행하여야 한다.",
  "선거에 있어서 최고득표자가 2인 이상인 때에는 국회의 재적의원 과반수가 출석한 공개회의에서 다수표를 얻은 자를 당선자로 한다. 공무원의 신분과 정치적 중립성은 법률이 정하는 바에 의하여 보장된다.",
];

export function AboutContent() {
  return (
    <>
      <Container as="section" aria-label="브랜드 소개 서두" className="pb-[65px] pt-[104px]">
        <AboutTextBlock />
      </Container>

      <section
        aria-label="브랜드 비주얼"
        className="relative flex h-[520px] w-full items-center justify-center overflow-hidden bg-surface-hero md:h-[900px] lg:h-[1430px]"
      >
        <Image
          src={tomatoImage(7, { width: 1440, height: 1430, quality: 75 })}
          alt="eatomato 브랜드 비주얼"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </section>

      <Container as="section" aria-label="브랜드 소개 결말" className="pb-[148px] pt-[74px]">
        <AboutTextBlock />
      </Container>
    </>
  );
}

function AboutTextBlock() {
  return (
    <div className="flex w-full max-w-[760px] flex-col gap-[26px]">
      {ABOUT_PARAGRAPHS.map((paragraph, i) => (
        <p
          key={i}
          className="text-[15px] font-normal leading-[1.7] tracking-[-0.2px] text-black"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
