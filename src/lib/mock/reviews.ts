import type { ReviewThumbnail } from "@/types/review";

import { tomatoImage } from "./tomato-images";

/** 리뷰 썸네일은 상품 카드와 동일한 3:4 비율. */
const reviewImage = (index: number) =>
  tomatoImage(index, { width: 800, height: 1000 });

export const MOCK_REVIEW_THUMBNAILS: ReviewThumbnail[] = [
  {
    id: "rv-01",
    productSlug: "mellow-macsafe",
    alt: "MELLOW 케이스 리뷰 1",
    imageUrl: reviewImage(9),
  },
  {
    id: "rv-02",
    productSlug: "dottie-cream-red",
    alt: "DOTTIE 케이스 리뷰",
    imageUrl: reviewImage(10),
  },
  {
    id: "rv-03",
    productSlug: "clear-jelly-hard",
    alt: "CLEAR JELLY HARD 리뷰",
    imageUrl: reviewImage(11),
  },
  {
    id: "rv-04",
    productSlug: "card-wallet-classic",
    alt: "카드지갑 CLASSIC 리뷰",
    imageUrl: reviewImage(12),
  },
];
