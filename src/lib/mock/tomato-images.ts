/**
 * Mock 단계 전용 이미지 헬퍼.
 *
 * eatomato 브랜드 컨셉(토마토)에 맞춰 Unsplash 에서 실측 확인된 토마토/식자재 이미지 ID 를 모아 두고,
 * 인덱스로 순환 접근해 배너·상품·리뷰 mock 데이터에 주입한다.
 *
 * 실 API 연동 후에는 이 파일과 참조를 통째로 삭제하면 된다.
 * (mock 이라는 것을 코드 위치와 파일명으로 명시해 나중에 청소가 쉽도록 격리했다.)
 */

const UNSPLASH_TOMATO_IDS = [
  "1592924357228-91a4daadcfea",
  "1607305387299-a3d9611cd469",
  "1524593166156-312f362cada0",
  "1592841200221-a6898f307baa",
  "1567375698348-5d9d5ae99de0",
  "1461009683693-342af2f2d6ce",
  "1587049352846-4a222e784d38",
  "1571680322279-a226e6a4cc2a",
  "1594007654729-407eedc4be65",
  "1518977676601-b53f82aba655",
  "1582515073490-39981397c445",
  "1512058564366-18510be2db19",
  "1489450278009-822e9be04dff",
  "1573246123716-6b1782bfc499",
  "1608897013039-887f21d8c804",
];

type TomatoImageOptions = {
  width?: number;
  height?: number;
  /** 부드러운 색감을 원하면 60~70, 선명도가 필요하면 80~90. 기본 80. */
  quality?: number;
};

/**
 * 인덱스 기반으로 안정적인 이미지 URL 을 반환한다.
 * 같은 index 는 항상 같은 이미지를 리턴 → 서버/클라이언트 렌더 결과가 일치한다.
 */
export function tomatoImage(index: number, options: TomatoImageOptions = {}): string {
  const { width = 800, height = 1000, quality = 80 } = options;
  const id = UNSPLASH_TOMATO_IDS[index % UNSPLASH_TOMATO_IDS.length];
  return `https://images.unsplash.com/photo-${id}?w=${width}&h=${height}&fit=crop&auto=format&q=${quality}`;
}
