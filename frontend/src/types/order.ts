/**
 * 주문 상태. 결제대기 → (무통장입금이면 입금대기 →) 결제완료 → 배송중 → 배송완료. 배송 전까지 취소 가능.
 * 결제완료·입금대기로는 결제 승인·입금 확인(PG 웹훅)으로만 바뀐다.
 */
export type OrderStatus = "PENDING_PAYMENT" | "AWAITING_DEPOSIT" | "PAID" | "SHIPPING" | "DELIVERED" | "CANCELLED";

/** 주문 상태 표시 문구. 목록·필터·상태 변경 셀렉트가 이 순서를 공유한다. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "결제대기",
  AWAITING_DEPOSIT: "입금대기",
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

/** 주문 시점 배송지. 배송지 입력 이전에 만든 주문에는 없다. */
export type OrderShipping = {
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  roadAddress: string;
  detailAddress?: string;
  deliveryMemo?: string;
};

/** 무통장입금 계좌. bankCode 는 토스 은행 코드(bankName 으로 이름을 붙인다). */
export type VirtualAccount = {
  bankCode: string;
  accountNumber: string;
  customerName?: string;
  /** 입금 기한. ISO 8601 (+09:00) */
  dueAt?: string;
};

/** 결제수단(PG 가 알려 준 한글 이름: 카드, 가상계좌 등)과 무통장입금 계좌. */
export type OrderPayment = {
  method?: string;
  virtualAccount?: VirtualAccount;
};

export type Order = {
  orderNumber: string;
  status: OrderStatus;
  /** ISO 8601 (+09:00) */
  orderedAt: string;
  paidAt?: string;
  cancelledAt?: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  /** 고객이 직접 취소할 수 있는지(결제대기·입금대기·결제완료). 무통장입금으로 입금이 끝난 주문은 고객센터로. */
  cancellable: boolean;
  shipping?: OrderShipping;
  items: OrderItem[];
  payment?: OrderPayment;
};
