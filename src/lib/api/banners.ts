import { MOCK_HERO_BANNERS } from "@/lib/mock/banners";
import type { HeroBanner } from "@/types/banner";

/**
 * 메인 히어로 배너 목록.
 * 실제 서비스에서는 CMS/어드민에서 관리하는 배너를 조회한다.
 */
export async function listHeroBanners(): Promise<HeroBanner[]> {
  return MOCK_HERO_BANNERS;
}
