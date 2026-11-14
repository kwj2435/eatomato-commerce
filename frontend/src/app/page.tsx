import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { BestPicksSection } from "@/features/home/BestPicksSection";
import { HeroBanner } from "@/features/home/HeroBanner";
import { TomatoEditSection } from "@/features/home/TomatoEditSection";
import { ReviewSection } from "@/features/home/ReviewSection";
import { SpecialSection } from "@/features/home/SpecialSection";
import { WhatsNewSection } from "@/features/home/WhatsNewSection";
import { listHeroBanners } from "@/lib/api/banners";
import { getSiteContents } from "@/lib/api/site-content";
import { BASE_OPEN_GRAPH, INSTAGRAM_URL, NAVER_BLOG_URL, SITE_DESCRIPTION, SITE_NAME, SITE_NAME_KO, SITE_URL, jsonLd } from "@/lib/site";

/** 메인만 대표 주소를 / 로 둔다(레이아웃에 두면 모든 하위 페이지가 메인을 대표 주소로 물려받는다). */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...BASE_OPEN_GRAPH, url: "/" },
};

/** 검색엔진이 브랜드(공식 사이트)를 알아보도록 사이트·운영자 정보를 구조화 데이터로 둔다. */
const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: [SITE_NAME_KO, "잇토마토 공식몰"],
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/icon.png`,
      sameAs: [INSTAGRAM_URL, NAVER_BLOG_URL],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: SITE_NAME_KO,
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
      inLanguage: "ko-KR",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/search/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

/**
 * 메인 페이지.
 *
 * 서버 컴포넌트에서 필요한 데이터를 병렬로 fetch 한다.
 * `Promise.all` 이면 네트워크 대기 시간이 순차 호출 대비 짧아진다.
 * Hero 는 상호작용(슬라이더)이 필요해 클라이언트 컴포넌트로 분리했다.
 */
export default async function HomePage() {
  const [banners, contents] = await Promise.all([listHeroBanners(), getSiteContents()]);

  return (
    <SiteFrame notice={contents.HOME_TOP_NOTICE}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(SITE_JSON_LD) }} />
      {/* 화면에는 로고가 제목 역할을 하므로 검색엔진·화면 읽기용 제목은 숨겨 둔다. */}
      <h1 className="sr-only">eatomato 잇토마토 — 핸드폰 케이스와 라이프스타일 굿즈 공식 온라인 스토어</h1>
      <HeroBanner banners={banners} />
      {/* 방문자 대부분이 인스타그램에서 모바일로 홈에 들어와 바로 나가서(2026-11 기준 약 77%),
          상품(Best Picks)을 히어로 바로 아래에 두고 후기를 혜택(Special)보다 먼저 보인다. */}
      <BestPicksSection description={contents.HOME_BEST_PICKS_DESCRIPTION} />
      <TomatoEditSection description={contents.HOME_EDIT_DESCRIPTION} />
      <WhatsNewSection description={contents.HOME_WHATS_NEW_DESCRIPTION} />
      <ReviewSection description={contents.HOME_REVIEW_DESCRIPTION} />
      <SpecialSection description={contents.HOME_SPECIAL_DESCRIPTION} />
    </SiteFrame>
  );
}
