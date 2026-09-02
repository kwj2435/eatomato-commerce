import type { Product } from "./product";

/**
 * 상품 상세 도메인 타입.
 *
 * 리스트 조회는 `Product` 로 충분하지만, 상세 페이지는 옵션 그룹·상세 이미지·리뷰 등
 * 훨씬 무거운 데이터가 필요하다. 리스트 응답에 이 필드들이 섞이면 페이로드가 비대해지므로
 * 별도 `ProductDetail` 로 분리해 실제 API 도 `/products/{slug}` 엔드포인트에서만 이 형태를 반환한다.
 */

/** 옵션 선택지 하나. 옵션 그룹은 여러 choice 중 하나만 고른다. */
export type OptionChoice = {
  id: string;
  label: string;
  /** 기본가에 가감할 금액(원). 예: "맥세이프 (+4,000원)" 이면 4000. */
  priceDelta: number;
};

/** 색상/부착타입/기종 같은 옵션 그룹. */
export type OptionGroup = {
  id: string;
  label: string;
  choices: OptionChoice[];
};

/** 함께 구매(BETTER TOGETHER) 후보. 자체 옵션 그룹을 가진다. */
export type BetterTogetherItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice?: number;
  imageUrl?: string;
  optionGroups: OptionGroup[];
};

/** 리뷰 한 건. */
export type ProductReview = {
  id: string;
  writer: string;
  rating: 1 | 2 | 3 | 4 | 5;
  content: string;
  isBest?: boolean;
  imageUrl?: string;
};

export type ProductDetail = Product & {
  /** 상품명 아래 배송/제작 안내 문단들. */
  noticeLines: string[];
  /** 적립금 비율(%) — 정수. */
  rewardRate: number;
  /** 상세 페이지에 노출할 부가 배송 문구. */
  shippingLines: string[];
  optionGroups: OptionGroup[];
  betterTogether: BetterTogetherItem[];
  /** DETAILS 섹션의 세로 이미지 배열. */
  detailImages: string[];
  reviews: ProductReview[];
  reviewCount: number;
};
