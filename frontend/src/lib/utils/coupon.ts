import { formatKRW } from "@/lib/utils/format";
import type { CouponTerms } from "@/types/benefit";

/**
 * 상품 금액(subtotal)에 대한 쿠폰 할인액. 서버(Coupon.discountFor)와 같은 규칙:
 * 최소 주문 금액 미달이면 0, 정률은 원 미만 버림 후 상한, 상품 금액을 넘지 않음. 배송비에는 붙지 않는다.
 * 화면 미리보기용이고, 실제 할인은 주문을 만들 때 서버가 다시 계산한다.
 */
export function couponDiscount(coupon: CouponTerms, subtotal: number): number {
  if (subtotal < coupon.minOrderAmount) return 0;
  let discount =
    coupon.discountType === "FIXED" ? coupon.discountValue : Math.floor((subtotal * coupon.discountValue) / 100);
  if (coupon.discountType === "PERCENT" && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  return Math.min(discount, subtotal);
}

/** "2,000원 할인" / "10% 할인 (최대 1,000원)" */
export function describeDiscount(coupon: CouponTerms): string {
  if (coupon.discountType === "FIXED") return `${formatKRW(coupon.discountValue)} 할인`;
  return `${coupon.discountValue}% 할인${coupon.maxDiscount ? ` (최대 ${formatKRW(coupon.maxDiscount)})` : ""}`;
}

/** "3만원 이상 구매 시" 같은 조건 문구. 조건이 없으면 빈 문자열. */
export function describeMinOrder(coupon: CouponTerms): string {
  return coupon.minOrderAmount > 0 ? `${formatKRW(coupon.minOrderAmount)} 이상 구매 시` : "";
}
