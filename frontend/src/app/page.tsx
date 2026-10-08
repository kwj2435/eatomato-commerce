import { SiteFrame } from "@/components/layout/SiteFrame";
import { BestPicksSection } from "@/features/home/BestPicksSection";
import { HeroBanner } from "@/features/home/HeroBanner";
import { ReviewSection } from "@/features/home/ReviewSection";
import { SpecialSection } from "@/features/home/SpecialSection";
import { WhatsNewSection } from "@/features/home/WhatsNewSection";
import { listHeroBanners } from "@/lib/api/banners";
import { getSiteContents } from "@/lib/api/site-content";

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
    <SiteFrame notice="신규가입 시 2,000원 쿠폰과 멤버 전용 혜택을 즐겨보세요.">
      <HeroBanner banners={banners} />
      <BestPicksSection description={contents.HOME_BEST_PICKS_DESCRIPTION} />
      <WhatsNewSection description={contents.HOME_WHATS_NEW_DESCRIPTION} />
      <SpecialSection description={contents.HOME_SPECIAL_DESCRIPTION} />
      <ReviewSection description={contents.HOME_REVIEW_DESCRIPTION} />
    </SiteFrame>
  );
}
