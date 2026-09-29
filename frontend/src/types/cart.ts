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
  /** 지금 주문할 수 있는지(판매 중 + 재고 충분). false 면 주문서로 넘길 수 없다. */
  available: boolean;
  /** 남은 재고. 재고를 관리하지 않는 상품은 없다. */
  stock?: number;
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
  /** 배송비 정책(관리자 설정). 안내 문구를 이 값으로 만든다. 제주 추가 배송비는 주문서에서 더한다. */
  shippingPolicy: { freeThreshold: number; standardFee: number; remoteAreaFee: number };
};
