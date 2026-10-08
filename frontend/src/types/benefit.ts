/** 쿠폰 할인 방식. FIXED: 정액(원), PERCENT: 정률(%). */
export type DiscountType = "FIXED" | "PERCENT";

/** 내가 받은 쿠폰 한 장. */
export type MemberCoupon = {
  id: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  /** PERCENT 할인 상한(원). */
  maxDiscount?: number;
  minOrderAmount: number;
  issuedAt: string;
  /** 비어 있으면 기한 없음. */
  expiresAt?: string;
  usedAt?: string;
  status: "AVAILABLE" | "USED" | "EXPIRED";
};

export type PointType = "ORDER_EARN" | "REVIEW_EARN" | "ORDER_USE" | "ORDER_REFUND";

export type PointEntry = {
  id: string;
  type: PointType;
  /** 적립 +, 사용 - */
  amount: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
};

export type Points = {
  balance: number;
  /** 최근 내역(최대 100건, 최신순). */
  history: PointEntry[];
};

/** 쿠폰 조건(할인 방식·값·상한·최소 주문 금액). 관리자 쿠폰과 내 쿠폰이 함께 쓴다. */
export type CouponTerms = Pick<MemberCoupon, "discountType" | "discountValue" | "maxDiscount" | "minOrderAmount">;
