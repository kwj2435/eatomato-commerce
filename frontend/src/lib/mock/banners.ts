import type { HeroBanner } from "@/types/banner";

import { tomatoImage } from "./tomato-images";

/**
 * 히어로 배너는 1440 × 814 프레임을 채우도록 landscape 로 요청한다.
 * quality 를 75 로 낮춰 첫 화면 페인트 부담을 줄였다.
 */
const banner = (index: number) =>
  tomatoImage(index, { width: 1440, height: 814, quality: 75 });

export const MOCK_HERO_BANNERS: HeroBanner[] = [
  {
    id: "banner-01",
    captionLines: ["메인화면 이미지 클릭하면", "이미지 관련한 제품으로 넘어갈 수 있게"],
    href: "/products/phone-case",
    imageUrl: banner(0),
    alt: "메인 배너 1 — 핸드폰 케이스 신제품",
  },
  {
    id: "banner-02",
    captionLines: ["시즌 컬렉션", "감각적인 톤 온 톤을 만나보세요"],
    href: "/products/phone-acc",
    imageUrl: banner(1),
    alt: "메인 배너 2 — 시즌 컬렉션",
  },
  {
    id: "banner-03",
    captionLines: ["에어팟 케이스", "새로운 스타일이 추가되었어요"],
    href: "/products/phone-acc/airpods-case",
    imageUrl: banner(2),
    alt: "메인 배너 3 — 에어팟 케이스",
  },
  {
    id: "banner-04",
    captionLines: ["세트 상품", "함께 사면 더 예뻐요"],
    href: "/products/set",
    imageUrl: banner(3),
    alt: "메인 배너 4 — 세트 상품",
  },
  {
    id: "banner-05",
    captionLines: ["신규 회원 혜택", "지금 가입하고 2,000원 쿠폰 받기"],
    href: "/register",
    imageUrl: banner(4),
    alt: "메인 배너 5 — 신규 회원 혜택",
  },
  {
    id: "banner-06",
    captionLines: ["MD's Pick", "이번 주 큐레이션을 확인하세요"],
    href: "/products/phone-case",
    imageUrl: banner(5),
    alt: "메인 배너 6 — MD 픽",
  },
  {
    id: "banner-07",
    captionLines: ["카드 지갑 리뉴얼", "슬림해진 데일리 아이템"],
    href: "/products/phone-acc/card-wallet",
    imageUrl: banner(6),
    alt: "메인 배너 7 — 카드 지갑",
  },
];
