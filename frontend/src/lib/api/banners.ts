import type { HeroBanner } from "@/types/banner";

import { apiFetch } from "./client";

/** 메인 히어로 배너 목록. 빌드 시점에 받아 정적 HTML 에 넣는다. */
export async function listHeroBanners(): Promise<HeroBanner[]> {
  return apiFetch<HeroBanner[]>("/api/banners");
}
