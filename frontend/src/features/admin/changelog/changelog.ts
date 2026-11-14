/**
 * 관리자 > 업데이트 이력. 기능을 추가·개선·수정해 배포할 때 맨 위에 한 줄씩 더한다(최신이 위).
 *
 * git 커밋을 그대로 쓰지 않고 손으로 고른다: 배포 스크립트·백업·패키지 정리 같은 내부 작업은 빼고,
 * 고객이나 관리자가 알아야 할 변화만 남긴다. 2026-09 ~ 11 은 git 기록에서 옮겨 적었다.
 */

export type ChangeType = "new" | "improve" | "fix";
export type ChangeArea = "스토어" | "관리자" | "주문·결제" | "회원" | "운영";

export type ChangeItem = {
  type: ChangeType;
  area: ChangeArea;
  title: string;
  /** 한두 문장 설명. 없으면 생략. */
  detail?: string;
};

export type ChangeDay = { date: string; items: ChangeItem[] };

export const CHANGELOG: ChangeDay[] = [
  {
    date: "2026-11-14",
    items: [
      {
        type: "improve",
        area: "스토어",
        title: "메인 섹션 순서 변경",
        detail: "Best Picks 를 배너 바로 아래로 올리고, Review 를 Special 위로 옮겼습니다. 순서: Best Picks → Tomato Edit → What's New → Review → Special.",
      },
      {
        type: "improve",
        area: "스토어",
        title: "메인 Review 빈 칸을 이벤트 카드로 채움",
        detail:
          "메인 Review 에 후기가 1~3개뿐이면 남은 칸에 '다음 후기의 주인공이 되어주세요' 포토후기 이벤트 카드가 나옵니다. 후기가 4개가 되면 저절로 사라집니다.",
      },
      {
        type: "fix",
        area: "스토어",
        title: "상품 평점이 0.0으로 나오던 문제 수정",
        detail: "후기가 저장될 때마다 상품 평점을 후기 평균으로 다시 계산합니다. 기존 상품 평점도 후기 평균으로 맞췄습니다.",
      },
    ],
  },
  {
    date: "2026-11-11",
    items: [
      {
        type: "improve",
        area: "스토어",
        title: "메인 '전체 보기'를 눈에 띄게 개선",
        detail:
          "Best Picks·What's New 제목 옆 '전체 보기'를 테두리 버튼으로 바꾸고, 상품 목록 아래에 '베스트 제품 전체 보기'·'신상품 전체 보기' 버튼을 추가했습니다. Best Picks 큰 사진에 SHOP NOW 가 붙고 누르면 제품 목록으로 이동합니다.",
      },
      {
        type: "improve",
        area: "운영",
        title: "Best Picks 사진에 링크 넣기",
        detail: "배너 관리 > Best Picks 에서 사진을 눌렀을 때 갈 주소를 넣을 수 있습니다. 비워 두면 휴대폰 케이스 목록으로 갑니다.",
      },
      {
        type: "fix",
        area: "스토어",
        title: "공지사항 글이 왼쪽으로 치우쳐 보이던 문제 수정",
        detail: "PC 화면에서 공지사항 글이 화면 가운데에 보입니다. 모바일 화면은 그대로입니다.",
      },
    ],
  },
  {
    date: "2026-11-10",
    items: [
      {
        type: "fix",
        area: "스토어",
        title: "후기 사진이 한 장만 보이던 문제 수정",
        detail:
          "사진을 여러 장 올린 후기는 썸네일에 +N 이 표시되고, 누르면 모든 사진을 크게 넘겨 볼 수 있습니다. 이미 올라온 후기의 사진도 그대로 보입니다.",
      },
    ],
  },
  {
    date: "2026-11-09",
    items: [
      {
        type: "improve",
        area: "회원",
        title: "로그아웃 버튼 위치 추가",
        detail: "헤더 회원 아이콘 메뉴(데스크톱), 모바일 메뉴, 마이페이지 위쪽에서 바로 로그아웃할 수 있습니다.",
      },
      {
        type: "new",
        area: "회원",
        title: "카카오 가입 시 휴대전화번호·연계정보(CI) 수집",
        detail:
          "카카오가 제공하면 휴대전화번호와 CI(해시로만 저장)를 받고, 같은 사람이 다른 카카오 계정으로 다시 가입하는 것을 막습니다. 필수 동의는 카카오 비즈 앱 심사 후 켭니다.",
      },
      {
        type: "improve",
        area: "회원",
        title: "개인정보 처리방침 개정(11월 16일 시행)",
        detail: "수집 항목에 휴대전화번호·CI, 처리 목적에 중복 가입 방지·알림톡 안내, 위탁 업체에 솔라피를 추가했습니다.",
      },
      {
        type: "new",
        area: "주문·결제",
        title: "주문 단계별 카카오 알림톡",
        detail:
          "결제완료·상품준비중·배송시작·취소환불을 받는 분 연락처로 알림톡을 보냅니다. 카카오 검수를 마친 템플릿부터 하나씩 켜집니다.",
      },
      {
        type: "new",
        area: "관리자",
        title: "업데이트 이력 탭",
        detail: "기능을 추가·개선·수정한 이력을 관리자에서 날짜별로 볼 수 있습니다.",
      },
      {
        type: "improve",
        area: "관리자",
        title: "마케팅 인사이트 → 개선 제안 보드",
        detail:
          "질문하는 방식 대신 매일 오전 8시에 AI 가 데이터를 보고 기획·디자인·마케팅·운영 개선 제안을 냅니다. 채택·보류·제외·완료로 관리하고, 완료 7일 뒤 전후 지표로 효과를 확인합니다.",
      },
      {
        type: "new",
        area: "관리자",
        title: "마케팅 인사이트(AI 에이전트)",
        detail: "AI 가 방문·주문·후기 데이터를 직접 조회해 근거 숫자가 붙은 리포트를 만듭니다. 고객 개인정보는 AI 에 보내지 않습니다.",
      },
      {
        type: "new",
        area: "관리자",
        title: "대시보드 오늘의 브리핑",
        detail: "처리할 주문·재고 부족·낮은 별점 후기를 긴급·확인·참고로 묶어 보여 주고, 어제 실적을 지난주 같은 요일과 비교합니다.",
      },
      {
        type: "improve",
        area: "관리자",
        title: "주문·결제 상태 칸 개선",
        detail: "선택 목록 대신 상태 칩과 다음 단계 버튼으로 바꾸고, 환불되는 주문 취소는 따로 떨어뜨렸습니다.",
      },
      {
        type: "new",
        area: "주문·결제",
        title: "주문 상태 '상품준비중' 추가",
        detail: "결제완료 다음 단계입니다. 상품준비중부터는 고객이 직접 취소할 수 없고 관리자만 취소합니다.",
      },
    ],
  },
  {
    date: "2026-11-08",
    items: [
      { type: "improve", area: "관리자", title: "방문자 분석: 게시물별 유입(?from=)과 구매 단계 기록" },
      { type: "improve", area: "스토어", title: "모바일 터치 영역 확대" },
    ],
  },
  {
    date: "2026-11-06",
    items: [
      {
        type: "improve",
        area: "스토어",
        title: "스토어 개선 제안서 피드백 반영",
        detail: "베스트 순위·할인율 표시, 섹션 제목, 후기 이벤트, 상품 목록, 한글 검색어, 404 페이지",
      },
    ],
  },
  {
    date: "2026-11-05",
    items: [
      { type: "new", area: "관리자", title: "방문자 분석", detail: "페이지 조회 기록으로 방문자·유입 경로·많이 본 상품을 봅니다." },
      { type: "new", area: "운영", title: "네이버·구글 검색 노출 준비", detail: "robots·sitemap, 공유 사진, 구조화 데이터, 서치어드바이저 소유확인" },
      { type: "improve", area: "스토어", title: "About 6차 시안 반영" },
      { type: "improve", area: "스토어", title: "파비콘을 토마토 일러스트로 교체" },
    ],
  },
  {
    date: "2026-11-04",
    items: [
      { type: "improve", area: "스토어", title: "장바구니 화면 개편", detail: "2단 레이아웃, 정가·할인·적립 예정 금액, 모바일 하단 주문 바" },
      { type: "improve", area: "스토어", title: "공지사항·About 개편, 메뉴에 현재 페이지 표시" },
    ],
  },
  {
    date: "2026-11-03",
    items: [
      { type: "new", area: "회원", title: "가입 약관 필수 동의와 회원 탈퇴" },
      { type: "improve", area: "회원", title: "아이디·비밀번호 로그인 제거(카카오·네이버만)" },
      { type: "new", area: "스토어", title: "메인 상단 The Tomato Edit 섹션" },
      { type: "improve", area: "스토어", title: "상품 상세 개선", detail: "모바일 첫 화면 가격·하단 구매 바·옵션 창, 사진 넘기기, 안내문 접기" },
      { type: "improve", area: "회원", title: "마이페이지 개편", detail: "요약·주문 카드·송장 조회, 회원 정보 수정 페이지 분리" },
      { type: "fix", area: "관리자", title: "상품 주소가 카테고리 주소와 겹치지 않게 검사" },
    ],
  },
  {
    date: "2026-11-02",
    items: [
      { type: "new", area: "회원", title: "네이버 로그인, 로그인 화면 새 디자인" },
      { type: "improve", area: "스토어", title: "상품 카드 배지 정리(모바일 크기 축소, SALE 색 통일)" },
    ],
  },
  {
    date: "2026-10-29",
    items: [{ type: "improve", area: "운영", title: "업로드 이미지 화질 개선(큰 배너도 변환)" }],
  },
  {
    date: "2026-10-28",
    items: [
      { type: "improve", area: "운영", title: "서버 이관(Vultr)과 DB·업로드 파일 12시간마다 백업" },
      {
        type: "fix",
        area: "운영",
        title: "보안 점검 반영",
        detail: "후기 적립 악용·동시 취소·오픈 리다이렉트·전달 헤더 위조·주문 남용 차단",
      },
    ],
  },
  {
    date: "2026-10-24",
    items: [
      { type: "new", area: "관리자", title: "주문 송장(택배사·송장번호) 입력, 송장 있을 때만 배송중 변경" },
      { type: "new", area: "관리자", title: "상단 공지 바 문구를 관리자에서 편집" },
      { type: "improve", area: "스토어", title: "모바일 4차 시안 반영" },
    ],
  },
  {
    date: "2026-10-22",
    items: [
      { type: "improve", area: "스토어", title: "옵션 선택 개선", detail: "PC 드롭다운 높이 제한, 모바일 하단 시트, 10개 넘으면 검색" },
      { type: "improve", area: "운영", title: "이미지 속도 개선(WebP 우선 제공, 30일 캐시)" },
      { type: "fix", area: "스토어", title: "배송 안내 구분선 때문에 생기던 모바일 가로 스크롤" },
    ],
  },
  {
    date: "2026-10-17",
    items: [{ type: "new", area: "관리자", title: "배너 모바일 전용 이미지 등록" }],
  },
  {
    date: "2026-10-15",
    items: [
      { type: "new", area: "스토어", title: "이용약관 페이지, 푸터 사업자 정보 정리" },
      { type: "improve", area: "관리자", title: "상품 옵션 순서 변경" },
    ],
  },
  {
    date: "2026-10-13",
    items: [
      { type: "improve", area: "관리자", title: "옵션 선택지 100개까지, 검증 실패 사유 표시" },
      { type: "new", area: "관리자", title: "About 페이지 글·이미지 수정" },
      { type: "improve", area: "운영", title: "업로드 이미지 자동 축소·WebP 압축" },
    ],
  },
  {
    date: "2026-10-12",
    items: [
      { type: "new", area: "주문·결제", title: "비회원 주문" },
      { type: "new", area: "스토어", title: "개인정보 처리방침" },
    ],
  },
  {
    date: "2026-10-08",
    items: [
      { type: "new", area: "주문·결제", title: "쿠폰·적립금" },
      { type: "new", area: "스토어", title: "메인 Best Picks·Special 섹션" },
      { type: "new", area: "관리자", title: "상품 일괄 등록(여러 초안 한 번에, 기존 상품 복사)" },
    ],
  },
  {
    date: "2026-10-03",
    items: [
      { type: "new", area: "주문·결제", title: "무통장입금(가상계좌) 결제" },
      { type: "improve", area: "스토어", title: "메인 빈 상태(기본 배너·자리표시 카드)" },
    ],
  },
  {
    date: "2026-09-30",
    items: [{ type: "improve", area: "스토어", title: "상단 메뉴 개편, 디자인 피드백 반영" }],
  },
  {
    date: "2026-09-29",
    items: [
      { type: "new", area: "주문·결제", title: "주문서·결제 흐름, 토스페이먼츠 결제위젯" },
      { type: "new", area: "관리자", title: "배송 준비 화면과 배송용 엑셀(CSV) 다운로드" },
      { type: "new", area: "관리자", title: "상품 할인율 일괄 조정" },
      { type: "new", area: "관리자", title: "재고·배송비 관리, 메인 섹션 문구 수정" },
    ],
  },
  {
    date: "2026-09-28",
    items: [
      { type: "new", area: "관리자", title: "관리자 페이지(상품·회원·주문/결제·배너·공지)" },
      { type: "new", area: "회원", title: "카카오 로그인" },
      { type: "fix", area: "회원", title: "로그인이 풀린 것처럼 보이던 문제, 토큰 자동 연장" },
      { type: "fix", area: "관리자", title: "권한 부여 직후 403 나던 문제" },
    ],
  },
  {
    date: "2026-09-08",
    items: [
      { type: "new", area: "스토어", title: "마이페이지·공지사항·상품 검색" },
      { type: "new", area: "스토어", title: "SET ITEM 카테고리" },
    ],
  },
  {
    date: "2026-09-02",
    items: [{ type: "new", area: "스토어", title: "첫 공개: 메인·상품 목록·상품 상세·About·로그인" }],
  },
];
