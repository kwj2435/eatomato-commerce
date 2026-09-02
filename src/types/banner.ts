/**
 * 메인 히어로 배너 슬라이드 단위.
 * 클릭 시 관련 제품/카테고리로 이동한다.
 */
export type HeroBanner = {
  id: string;
  /** 이미지 캡션(2줄). 시안대로 라인 단위로 배열로 관리한다. */
  captionLines: string[];
  href: string;
  imageUrl?: string;
  /** 스크린리더용 대체 텍스트. */
  alt: string;
};
