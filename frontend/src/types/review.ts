/**
 * 메인에 노출되는 대표 리뷰 카드(사진·글 일부·상품).
 * 누르면 리뷰한 상품 상세로 간다.
 */
export type ReviewThumbnail = {
  id: string;
  imageUrl?: string;
  alt: string;
  productSlug: string;
  productName: string;
  productImageUrl?: string;
  /** 1~5 */
  rating: number;
  content: string;
};

/** 마이페이지 "내가 쓴 글" 한 건. */
export type MyReview = {
  id: string;
  productSlug: string;
  productName: string;
  rating: number;
  content: string;
  images: string[];
  /** ISO 8601 (+09:00) */
  createdAt: string;
};
