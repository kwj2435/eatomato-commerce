export type OrderStatus = "PAID" | "SHIPPING" | "DELIVERED" | "CANCELLED";

/** 주문 상태 표시 문구. 목록·필터·상태 변경 셀렉트가 이 순서를 공유한다. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PAID: "결제완료",
  SHIPPING: "배송중",
  DELIVERED: "배송완료",
  CANCELLED: "취소",
};

export type OrderItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  option?: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
  reviewed: boolean;
};

export type Order = {
  orderNumber: string;
  status: OrderStatus;
  /** ISO 8601 (+09:00) */
  orderedAt: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  items: OrderItem[];
};
