/** 배너가 메인의 어느 자리에 보이는지. 백엔드 BannerPlacement 와 같다. */
export type BannerPlacement = "HERO" | "BEST_PICK" | "SPECIAL";

/**
 * 메인 배너 한 장(상단 슬라이드·Best Picks·Special 공통).
 * 클릭 시 관련 제품/카테고리/공지로 이동한다. 문구는 이미지에 직접 넣는다.
 */
export type HeroBanner = {
  id: string;
  /** 링크가 없는 배너(Best Picks 이미지)는 비어 있다. */
  href?: string;
  imageUrl?: string;
  /** 스크린리더용 대체 텍스트. 이미지 속 문구를 그대로 적는다. */
  alt: string;
};
