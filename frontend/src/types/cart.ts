/**
 * 장바구니 항목. 서버(`GET /api/cart`)가 내려주는 형태 그대로다.
 * 단가는 서버가 상품 판매가 + 옵션 추가금으로 계산한다.
 */
export type CartItem = {
  /** 장바구니 줄 id. 같은 상품·같은 옵션은 서버가 한 줄로 합친다. */
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

/** 선택된 항목 기준 결제 요약. 서버가 계산해 내려준다. */
export type CartSummary = {
  itemCount: number;
  selectedCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  freeShippingRemainder: number;
};

export type Cart = {
  items: CartItem[];
  summary: CartSummary;
  shippingPolicy: { freeThreshold: number; standardFee: number };
};

/** 배송 정책. 서버(ShippingPolicy)와 같은 값이며 안내 문구 표시에 쓴다. */
export const SHIPPING_POLICY = {
  freeThreshold: 80_000,
  standardFee: 3_000,
} as const;
