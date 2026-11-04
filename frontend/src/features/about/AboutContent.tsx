import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { MultilineText } from "@/components/ui/MultilineText";

export type AboutCategoryCard = {
  label: string;
  href: string;
  /** 카테고리 대표 상품 이미지. 없으면 회색 칸으로 둔다. */
  imageUrl?: string;
};

type AboutContentProps = {
  /** 맨 위 슬로건(관리자 문구 ABOUT_BOTTOM_TEXT). 첫 줄이 큰 제목, 다음 줄부터 설명. */
  slogan: string;
  /** 맨 위 큰 이미지(ABOUT_IMAGE_URL). */
  heroImageUrl: string;
  /** 소개 글(ABOUT_TOP_TEXT). 빈 줄로 나눈 문단을 순서대로 배치한다. */
  introText: string;
  /** 사진 옆 글의 이미지(ABOUT_STORY_IMAGE_URL). 비우면 글만 보인다. */
  storyImageUrl: string;
  categories: AboutCategoryCard[];
};

const INSTAGRAM_URL = "https://www.instagram.com/eatomato__/";

/**
 * About 페이지 본문.
 *
 * 구성: 슬로건 → 큰 이미지 → 소개(큰 문장 + 문단) → 인용 문구 → 사진 + 글 → 카테고리 → 쇼핑·인스타 CTA.
 *
 * 글은 관리자 화면(문구)에서 고친다. 운영 문구를 옮기지 않고 개편하려고 기존 키를 그대로 쓰고,
 * 소개 글은 문단 순서로 자리를 정한다(관리자 화면 라벨에 순서를 적어 두었다).
 * - 1문단: 큰 소개 문장 / 2문단: 소개 / 3문단: 인용 문구(첫 줄이 크게, 다음 줄은 설명) / 4문단부터: 사진 옆 글
 * 비어 있는 자리는 그리지 않는다.
 */
export function AboutContent({ slogan, heroImageUrl, introText, storyImageUrl, categories }: AboutContentProps) {
  const [headline, ...sloganRest] = slogan.trim().split("\n").map((line) => line.trim());
  const sloganSub = sloganRest.filter(Boolean).join("\n");

  const [lead, intro, quoteBlock, ...story] = splitParagraphs(introText);
  const [quote, ...quoteRest] = (quoteBlock ?? "").split("\n").map((line) => line.trim());
  const quoteCaption = quoteRest.filter(Boolean).join("\n");
  const heroImage = heroImageUrl.trim();
  const storyImage = storyImageUrl.trim();

  return (
    <>
      {headline ? (
        <Container as="section" aria-label="브랜드 슬로건" className="pb-10 pt-12 lg:pb-14 lg:pt-[84px]">
          <p className="text-[12px] font-semibold tracking-[2.5px] text-brand-deep">ABOUT EATOMATO</p>
          <h1 className="mt-3.5 text-balance break-keep font-serif text-[44px] font-semibold leading-[1.08] tracking-[-1px] text-brand-primary md:text-[72px] lg:text-[96px]">
            {headline}
          </h1>
          {sloganSub ? (
            <p className="mt-[18px] break-keep text-[16px] leading-[1.6] tracking-[-0.2px] text-ink-muted lg:text-[18px]">
              <MultilineText text={sloganSub} />
            </p>
          ) : null}
        </Container>
      ) : null}

      {heroImage ? (
        <section
          aria-label="브랜드 비주얼"
          className="relative aspect-[16/9] max-h-[720px] w-full overflow-hidden bg-surface-hero"
        >
          <Image src={heroImage} alt="eatomato 브랜드 비주얼" fill priority sizes="100vw" className="object-cover" />
        </section>
      ) : null}

      {lead ? (
        <Container
          as="section"
          aria-label="브랜드 소개"
          className="grid gap-5 py-14 lg:grid-cols-2 lg:gap-16 lg:py-24"
        >
          <h2 className="text-balance break-keep text-[24px] font-bold leading-[1.45] tracking-[-0.6px] text-ink-primary lg:text-[32px]">
            <MultilineText text={lead} />
          </h2>
          {intro ? (
            <p className="break-keep text-[15.5px] leading-[1.85] tracking-[-0.2px] text-ink-body">
              <MultilineText text={intro} />
            </p>
          ) : null}
        </Container>
      ) : null}

      {quote ? (
        <section aria-label="브랜드 문장" className="border-y border-[#F0E2DE] bg-surface-elevated">
          <Container className="py-14 text-center lg:py-[88px]">
            <blockquote className="text-balance break-keep font-serif text-[22px] font-medium leading-[1.55] tracking-[-0.4px] text-brand-secondary lg:text-[34px]">
              “{quote}”
            </blockquote>
            {quoteCaption ? (
              <p className="mt-4 break-keep text-[14.5px] leading-[1.6] tracking-[-0.2px] text-ink-muted">
                <MultilineText text={quoteCaption} />
              </p>
            ) : null}
          </Container>
        </section>
      ) : null}

      {story.length > 0 ? (
        <Container
          as="section"
          aria-label="브랜드 이야기"
          className={
            storyImage
              ? "grid items-center gap-6 py-14 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-24"
              : "py-14 lg:py-24"
          }
        >
          {storyImage ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-hero">
              <Image
                src={storyImage}
                alt=""
                fill
                sizes="(min-width: 1024px) 620px, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="flex max-w-[760px] flex-col gap-[18px]">
            {story.map((paragraph, i) => (
              <p key={i} className="break-keep text-[15.5px] leading-[1.85] tracking-[-0.2px] text-ink-body">
                <MultilineText text={paragraph} />
              </p>
            ))}
          </div>
        </Container>
      ) : null}

      {categories.length > 0 ? (
        <Container as="section" aria-labelledby="about-categories-title" className="pb-16">
          <h2 id="about-categories-title" className="mb-[18px] text-[18px] font-bold tracking-[-0.3px] text-ink-primary">
            잇토마토가 만드는 것
          </h2>
          <ul className="grid grid-cols-3 gap-3 md:gap-6">
            {categories.map((category) => (
              <li key={category.href}>
                <Link href={category.href} className="group block">
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/[0.04]">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1200px) 384px, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                  <span className="mt-2.5 flex items-center justify-between text-[14px] font-semibold tracking-[-0.2px] text-ink-primary md:text-[16px]">
                    {category.label}
                    <span aria-hidden className="hidden md:inline">
                      →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      ) : null}

      <section aria-label="쇼핑 안내" className="bg-brand-primary text-ink-inverse">
        <Container className="flex flex-wrap items-center justify-between gap-5 py-12">
          <div>
            <p className="font-serif text-[26px] font-semibold tracking-[-0.5px] lg:text-[34px]">
              오늘의 토마토를 만나보세요
            </p>
            <p className="mt-1.5 text-[14px] opacity-85">새로운 장면은 인스타그램 @eatomato__ 에서도 볼 수 있어요.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/products/phone-case"
              className="inline-flex h-12 items-center justify-center bg-surface-elevated px-8 text-[14.5px] font-semibold text-brand-primary transition-opacity hover:opacity-90"
            >
              제품 보러 가기
            </Link>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center border border-white/70 px-8 text-[14.5px] font-semibold transition-colors hover:bg-white/10"
            >
              Instagram
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
