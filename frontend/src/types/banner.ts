/**
 * 메인 히어로 배너 슬라이드 단위.
 * 클릭 시 관련 제품/카테고리로 이동한다. 문구는 이미지에 직접 넣는다.
 */
export type HeroBanner = {
  id: string;
  href: string;
  imageUrl?: string;
  /** 스크린리더용 대체 텍스트. 이미지 속 문구를 그대로 적는다. */
  alt: string;
};
