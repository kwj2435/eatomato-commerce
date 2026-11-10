/** 배너가 메인의 어느 자리에 보이는지. 백엔드 BannerPlacement 와 같다. */
export type BannerPlacement = "HERO" | "EDIT" | "BEST_PICK" | "SPECIAL";

/**
 * 메인 배너 한 장(상단 슬라이드·The Tomato Edit·Best Picks·Special 공통).
 * 클릭 시 관련 제품/카테고리/공지로 이동한다. 문구는 이미지에 직접 넣는다.
 */
export type HeroBanner = {
  id: string;
  /** 링크를 비운 배너(Best Picks 이미지)는 비어 있다. 이때 메인은 휴대폰 케이스 목록으로 보낸다. */
  href?: string;
  imageUrl?: string;
  /** 모바일 전용 이미지(세로형). 없으면 모바일에서도 imageUrl 을 쓴다. 상단 슬라이드(HERO)만 쓴다. */
  mobileImageUrl?: string;
  /** 스크린리더용 대체 텍스트. 이미지 속 문구를 그대로 적는다. */
  alt: string;
};
