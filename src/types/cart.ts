/**
 * 장바구니 항목.
 * 상품이 카트에 담기는 시점의 가격(unitPrice)을 함께 저장해 이후 가격 변동이 있어도
 * 결제 흐름에서 표시가 흔들리지 않게 한다.
 */
export type CartItem = {
  /** 카트 라인 고유 id (동일 상품 다른 옵션을 구분). 편의상 `${productId}:${option}` 조합. */
  id: string;
  productId: string;
  slug: string;
  name: string;
  option?: string;
  unitPrice: number;
  imageUrl?: string;
  quantity: number;
  /** 개별 선택 체크박스 상태. 결제 요약은 선택된 항목만 합산한다. */
  selected: boolean;
};

/** 배송 정책. 실서비스에서는 서버가 계산한 값을 그대로 받는다. */
export const SHIPPING_POLICY = {
  freeThreshold: 80_000,
  standardFee: 3_000,
} as const;
