import type { BannerPlacement, HeroBanner } from "@/types/banner";

import { apiFetch } from "./client";

/** 위치별 메인 배너 목록(기본: 상단 슬라이드). 빌드 시점에 받아 정적 HTML 에 넣는다. */
export async function listHeroBanners(placement: BannerPlacement = "HERO"): Promise<HeroBanner[]> {
  return apiFetch<HeroBanner[]>(`/api/banners?placement=${placement}`);
}
