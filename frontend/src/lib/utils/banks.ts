/**
 * 토스페이먼츠 은행 코드(숫자 2자리) ↔ 이름.
 * 무통장입금 계좌 안내와 관리자 환불 계좌 선택에 쓴다. 목록 순서가 셀렉트 순서다.
 */
export const BANKS: ReadonlyArray<{ code: string; name: string }> = [
  { code: "04", name: "KB국민은행" },
  { code: "88", name: "신한은행" },
  { code: "20", name: "우리은행" },
  { code: "81", name: "하나은행" },
  { code: "11", name: "NH농협은행" },
  { code: "03", name: "IBK기업은행" },
  { code: "90", name: "카카오뱅크" },
  { code: "92", name: "토스뱅크" },
  { code: "89", name: "케이뱅크" },
  { code: "71", name: "우체국" },
  { code: "23", name: "SC제일은행" },
  { code: "27", name: "씨티은행" },
  { code: "07", name: "수협은행" },
  { code: "31", name: "iM뱅크(대구)" },
  { code: "32", name: "부산은행" },
  { code: "39", name: "경남은행" },
  { code: "34", name: "광주은행" },
  { code: "37", name: "전북은행" },
  { code: "35", name: "제주은행" },
  { code: "45", name: "새마을금고" },
  { code: "48", name: "신협" },
  { code: "64", name: "산림조합" },
  { code: "50", name: "저축은행" },
];

/** 코드에 맞는 은행 이름. 목록에 없으면 코드를 그대로 보여 준다. */
export function bankName(code: string): string {
  return BANKS.find((bank) => bank.code === code)?.name ?? `은행(${code})`;
}
