import { SiteFrame } from "@/components/layout/SiteFrame";
import { HeroBanner } from "@/features/home/HeroBanner";
import { ReviewSection } from "@/features/home/ReviewSection";
import { WhatsNewSection } from "@/features/home/WhatsNewSection";
import { listHeroBanners } from "@/lib/api/banners";

/**
 * 메인 페이지.
 *
 * 서버 컴포넌트에서 필요한 데이터를 병렬로 fetch 한다.
 * `Promise.all` 이면 네트워크 대기 시간이 순차 호출 대비 짧아진다.
 * Hero 는 상호작용(슬라이더)이 필요해 클라이언트 컴포넌트로 분리했다.
 */
export default async function HomePage() {
  const [banners] = await Promise.all([listHeroBanners()]);

  return (
    <SiteFrame notice="신규가입 시 2,000원 쿠폰과 멤버 전용 혜택을 즐겨보세요.">
      <HeroBanner banners={banners} />
      <WhatsNewSection />
      <ReviewSection />
    </SiteFrame>
  );
}
