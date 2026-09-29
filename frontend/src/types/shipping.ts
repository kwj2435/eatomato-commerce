/** 배송비 정책(관리자 설정). */
export type ShippingPolicy = {
  baseFee: number;
  /** 이 금액 이상이면 기본 배송비 무료. 0 이면 항상 무료. */
  freeThreshold: number;
  /** 제주(우편번호 63으로 시작) 추가 배송비. 무료배송이어도 더한다. */
  remoteAreaFee: number;
  updatedAt?: string;
};

/** 서버(ShippingPolicy)와 같은 규칙. 화면 미리보기용이며 최종 금액은 서버가 계산한다. */
export function shippingFeeFor(policy: ShippingPolicy, subtotal: number, zipCode?: string): number {
  if (subtotal <= 0) return 0;
  const base = subtotal >= policy.freeThreshold ? 0 : policy.baseFee;
  return base + (isRemoteArea(zipCode) ? policy.remoteAreaFee : 0);
}

export function isRemoteArea(zipCode?: string): boolean {
  return !!zipCode && zipCode.trim().startsWith("63");
}
