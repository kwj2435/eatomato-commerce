import { formatNoticeDate } from "@/lib/utils/format";

/** 관리자 화면 날짜 표기(2026.09.28 14:51). 게시판과 같은 포맷터를 쓴다. */
export const formatDateTime = formatNoticeDate;

const COMPACT = new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 });

/** 차트 축처럼 좁은 자리에 쓰는 짧은 금액(1.2만). */
export function formatCompact(value: number): string {
  return COMPACT.format(value);
}
