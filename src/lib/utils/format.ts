/**
 * 원화 포맷터.
 *
 * `Intl.NumberFormat` 은 인스턴스 생성 비용이 있으므로 모듈 스코프에서 한 번만 만든다.
 * 시안이 `"23,000원"` 처럼 심볼 대신 접미사를 쓰므로 style: "decimal" + 접미사로 조립한다.
 */
const KRW_FORMATTER = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

export function formatKRW(price: number): string {
  return `${KRW_FORMATTER.format(price)}원`;
}
