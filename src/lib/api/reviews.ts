import { MOCK_REVIEW_THUMBNAILS } from "@/lib/mock/reviews";
import type { ReviewThumbnail } from "@/types/review";

/**
 * 메인에 노출할 대표 리뷰 썸네일.
 * 상세 페이지 리뷰 탭으로 진입한다.
 */
export async function listFeaturedReviews(
  params: { limit?: number } = {},
): Promise<ReviewThumbnail[]> {
  const { limit = 4 } = params;
  return MOCK_REVIEW_THUMBNAILS.slice(0, limit);
}
