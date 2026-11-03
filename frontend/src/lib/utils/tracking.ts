/**
 * 택배사·송장번호로 배송 조회 주소를 만든다.
 * 자주 쓰는 택배사는 택배사 조회 페이지로, 그 밖에는 네이버 검색(택배사 + 송장번호)으로 보낸다.
 */
const TRACKING_URLS: Record<string, (no: string) => string> = {
  CJ대한통운: (no) => `https://trace.cjlogistics.com/next/tracking.html?wblNo=${no}`,
  우체국택배: (no) => `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${no}`,
  한진택배: (no) => `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${no}`,
  롯데택배: (no) => `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${no}`,
  로젠택배: (no) => `https://www.ilogen.com/web/personal/trace/${no}`,
};

export function trackingUrl(courier: string, trackingNumber: string): string {
  const no = encodeURIComponent(trackingNumber.replace(/\D/g, "") || trackingNumber);
  const known = TRACKING_URLS[courier.replace(/\s+/g, "")];
  return known ? known(no) : `https://search.naver.com/search.naver?query=${encodeURIComponent(`${courier} ${trackingNumber}`)}`;
}

/** 4자리씩 띄워 읽기 쉽게: 123456789012 → 1234 5678 9012 */
export function formatTrackingNumber(trackingNumber: string): string {
  return /^\d+$/.test(trackingNumber) ? trackingNumber.replace(/(\d{4})(?=\d)/g, "$1 ") : trackingNumber;
}
