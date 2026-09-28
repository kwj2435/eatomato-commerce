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

/**
 * 게시판 등록일시 포맷터. 시안 표기 `2026.07.09 19:21` 을 따른다.
 *
 * `Intl.DateTimeFormat` 에 timeZone 을 고정한 이유:
 * 서버(UTC 컨테이너)와 브라우저(KST)의 기본 타임존이 달라 같은 값이 다르게 찍히면
 * 하이드레이션 불일치가 난다. 국내 서비스이므로 Asia/Seoul 로 못박는다.
 */
const NOTICE_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatNoticeDate(isoString: string): string {
  const parts = NOTICE_DATE_FORMATTER.formatToParts(new Date(isoString));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")} ${get("hour")}:${get("minute")}`;
}
