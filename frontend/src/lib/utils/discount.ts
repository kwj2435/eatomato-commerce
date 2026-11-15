/**
 * 정상가 대비 할인율(%). 할인이 없거나 할인가가 정상가 이상이면 null.
 *
 * 소수점은 버린다. 반올림하면 46,000원 → 37,000원(19.56%)이 "20%"처럼 실제보다 크게 보여
 * 할인율을 부풀려 표시하게 된다. 정수 계산이라 23,000원 → 19,550원은 정확히 15%다.
 */
export function discountRate(price: number, salePrice?: number | null): number | null {
  if (salePrice == null || price <= 0 || salePrice >= price) return null;
  const rate = Math.floor(((price - salePrice) * 100) / price);
  return rate > 0 ? rate : null;
}
