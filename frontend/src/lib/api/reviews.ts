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

/** 후기 작성 대상(구매 확정 상품) 선택지. */
export type ReviewableProduct = {
  slug: string;
  name: string;
};

/**
 * 로그인한 회원이 후기를 쓸 수 있는 구매 상품 목록.
 *
 * mock 회원은 주문 내역이 없으므로(마이페이지 "주문 내역이 없습니다.") 빈 배열을 돌려준다.
 * 실 API 연동 시 주문 조회 결과에서 후기 미작성 상품만 추려 반환하면 된다.
 */
export async function listReviewableProducts(): Promise<ReviewableProduct[]> {
  return [];
}
