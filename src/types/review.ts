/**
 * 메인에 노출되는 대표 리뷰 썸네일.
 * 상세 페이지 리뷰 탭으로 딥링크가 걸린다.
 */
export type ReviewThumbnail = {
  id: string;
  imageUrl?: string;
  alt: string;
  productSlug: string;
};
