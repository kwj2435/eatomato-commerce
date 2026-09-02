import type { CartItem } from "@/types/cart";

import { tomatoImage } from "./tomato-images";

/**
 * 장바구니 초기 시딩 데이터.
 *
 * 실서비스에서는 서버 세션에서 카트를 조회하므로 이 파일은 사라진다.
 * mock 단계에서는 사용자가 최초 방문 시 빈 카트가 아닌 시안과 유사한 상태를 볼 수 있도록 3건을 시딩한다.
 * (사용자가 조작한 이후에는 localStorage 값이 이 초기값을 덮어쓴다.)
 */
export const INITIAL_CART_ITEMS: CartItem[] = [
  {
    id: "prod-005:macsafe",
    productId: "prod-005",
    slug: "clear-jelly-hard",
    name: "맥세이프 카드슬롯_Afternoon Leaf",
    option: "Option: 세트 상품 / Model: 아이폰 17 AIR",
    unitPrice: 46_800,
    imageUrl: tomatoImage(0, { width: 240, height: 300 }),
    quantity: 1,
    selected: true,
  },
  {
    id: "prod-002:glossy",
    productId: "prod-002",
    slug: "dottie-cream-red",
    name: "실버 범퍼 케이스_Afternoon Leaf",
    option: "Option: 맥세이프 글로시 / Model: 아이폰 17 PROMAX",
    unitPrice: 26_850,
    imageUrl: tomatoImage(2, { width: 240, height: 300 }),
    quantity: 1,
    selected: true,
  },
  {
    id: "prod-007:macsafe-tok",
    productId: "prod-007",
    slug: "tok-cream-round",
    name: "[+맥세이프] 스마트톡_Afternoon Leaf",
    option: "Type: 맥세이프형",
    unitPrice: 14_900,
    imageUrl: tomatoImage(4, { width: 240, height: 300 }),
    quantity: 1,
    selected: true,
  },
];
