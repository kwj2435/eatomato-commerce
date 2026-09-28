import type { Notice } from "@/types/notice";

/**
 * 공지사항 시딩 데이터.
 *
 * 시안 5p 의 19행(상단 고정 12건 + 일반 7건)을 제목·글쓴이·등록일까지 그대로 옮겼다.
 * 시안에는 상세 화면이 없어 `body` 는 목록 제목에서 자연스럽게 이어지는 안내 문구로 채웠다.
 * 실서비스에서는 CMS/게시판 API 응답으로 대체된다.
 */

/** 상세 본문이 따로 준비되지 않은 공지의 기본 문구. */
const DEFAULT_BODY = [
  "자세한 내용은 고객센터로 문의해 주세요.",
  "이용에 참고 부탁드립니다. 감사합니다.",
];

export const MOCK_NOTICES: Notice[] = [
  // ── 상단 고정 공지 12건 (시안 순서 = 등록일 내림차순)
  {
    id: "notice-p01",
    number: null,
    title: "[공지] 7월 브랜드 휴무 및 사은품 안내",
    author: "관리자",
    publishedAt: "2026-07-09T19:21:00+09:00",
    pinned: true,
    body: [
      "7월 브랜드 휴무 기간 동안 주문은 정상 접수되며, 출고는 휴무 종료 후 순차적으로 진행됩니다.",
      "휴무 기간 중 주문하신 분들께는 소정의 사은품을 함께 보내드립니다.",
    ],
  },
  {
    id: "notice-p02",
    number: null,
    title: "[공지] 4주년 이벤트 안내",
    author: "관리자",
    publishedAt: "2026-07-01T19:05:00+09:00",
    pinned: true,
    body: [
      "eatomato 4주년을 맞아 전 상품 할인과 함께 럭키드로우 이벤트를 진행합니다.",
      "기간 내 구매 고객 전원에게 적립금이 자동 지급됩니다.",
    ],
  },
  {
    id: "notice-p03",
    number: null,
    title: "Lemon Field 신제품 이벤트 당첨자 발표",
    author: "관리자",
    publishedAt: "2026-02-23T21:01:00+09:00",
    pinned: true,
    body: DEFAULT_BODY,
  },
  {
    id: "notice-p04",
    number: null,
    title: "리뷰 이벤트 당첨 안내 (1월)",
    author: "관리자",
    publishedAt: "2026-02-02T16:42:00+09:00",
    pinned: true,
    body: DEFAULT_BODY,
  },
  {
    id: "notice-p05",
    number: null,
    title: "물류 시스템 재정비 및 배송 일정 안내",
    author: "관리자",
    publishedAt: "2026-01-19T11:46:00+09:00",
    pinned: true,
    body: [
      "물류 시스템 재정비로 인해 일부 주문의 출고가 1~2일 지연될 수 있습니다.",
      "빠르게 정상화하겠습니다. 너른 양해 부탁드립니다.",
    ],
  },
  {
    id: "notice-p06",
    number: null,
    title: "1월 배송 및 CS 휴무 안내",
    author: "관리자",
    publishedAt: "2026-01-02T08:02:00+09:00",
    pinned: true,
    body: DEFAULT_BODY,
  },
  {
    id: "notice-p07",
    number: null,
    title: "고객센터 안내 (CS · Help Center)",
    author: "관리자",
    publishedAt: "2025-12-20T14:44:00+09:00",
    pinned: true,
    body: [
      "고객센터 운영 시간은 평일 10:00 ~ 17:00 이며, 점심시간 12:30 ~ 13:30 에는 상담이 어렵습니다.",
      "주말 및 공휴일 문의는 다음 영업일에 순차적으로 답변드립니다.",
    ],
  },
  {
    id: "notice-p08",
    number: null,
    title: "2026년 회원 등급 정책 변경 안내",
    author: "관리자",
    publishedAt: "2025-12-14T14:52:00+09:00",
    pinned: true,
    body: DEFAULT_BODY,
  },
  {
    id: "notice-p09",
    number: null,
    title: "회원 등급 안내 (~2025.12.31)",
    author: "관리자",
    publishedAt: "2024-06-10T20:05:00+09:00",
    pinned: true,
    body: DEFAULT_BODY,
  },
  {
    id: "notice-p10",
    number: null,
    title: "저작권 관련 (Copyright)",
    author: "관리자",
    publishedAt: "2022-06-28T01:31:00+09:00",
    pinned: true,
    body: [
      "eatomato 의 모든 디자인과 이미지에 대한 저작권은 eatomato 에 있습니다.",
      "무단 도용 및 2차 가공을 금지합니다.",
    ],
  },
  {
    id: "notice-p11",
    number: null,
    title: "배송 안내 (Shipping)",
    author: "관리자",
    publishedAt: "2022-06-24T13:48:00+09:00",
    pinned: true,
    body: [
      "결제 완료 후 영업일 기준 2~5일 내에 출고됩니다.",
      "80,000원 이상 구매 시 배송비가 무료이며, 미만은 3,000원이 부과됩니다.",
    ],
  },
  {
    id: "notice-p12",
    number: null,
    title: "교환 및 반품 안내 (Exchange and Return)",
    author: "관리자",
    publishedAt: "2022-06-24T13:46:00+09:00",
    pinned: true,
    body: [
      "상품 수령 후 7일 이내에 고객센터로 신청해 주세요.",
      "단순 변심의 경우 왕복 배송비가 부과되며, 사용 흔적이 있는 상품은 교환·반품이 어렵습니다.",
    ],
  },

  // ── 일반 게시글 7건 (시안 번호 그대로. 중간 번호는 시안에서도 비어 있다)
  {
    id: "notice-13",
    number: 13,
    title: "옹시미 배경화면 공유 이벤트 당첨자 안내",
    author: "관리자",
    publishedAt: "2025-12-14T18:12:00+09:00",
    pinned: false,
    body: DEFAULT_BODY,
  },
  {
    id: "notice-12",
    number: 12,
    title: "블랙감사위크 럭키드로우 이벤트 당첨자 안내",
    author: "관리자",
    publishedAt: "2025-12-14T17:31:00+09:00",
    pinned: false,
    body: DEFAULT_BODY,
  },
  {
    id: "notice-11",
    number: 11,
    title: "하드타입 카드 케이스 유의사항 (Card Case)",
    author: "관리자",
    publishedAt: "2025-12-14T14:58:00+09:00",
    pinned: false,
    body: [
      "카드 수납부는 카드 1~2장 기준으로 제작되어, 그 이상 넣을 경우 늘어남이 발생할 수 있습니다.",
      "하드 소재 특성상 강한 충격에는 파손될 수 있으니 주의해 주세요.",
    ],
  },
  {
    id: "notice-10",
    number: 10,
    title: "하드 및 젤하드 케이스 유의사항 (Hard, Clear Case)",
    author: "관리자",
    publishedAt: "2025-12-14T14:55:00+09:00",
    pinned: false,
    body: [
      "투명 소재는 자외선과 사용 환경에 따라 시간이 지나면 자연스럽게 변색될 수 있습니다.",
      "이는 소재 고유의 특성으로 교환·반품 사유에 해당하지 않습니다.",
    ],
  },
  {
    id: "notice-6",
    number: 6,
    title: "에어팟 케이스 유의사항 (Airpods Case)",
    author: "관리자",
    publishedAt: "2024-02-24T22:02:00+09:00",
    pinned: false,
    body: DEFAULT_BODY,
  },
  {
    id: "notice-5",
    number: 5,
    title: "범퍼 케이스 유의 사항 (Bumper Case)",
    author: "관리자",
    publishedAt: "2024-02-24T21:54:00+09:00",
    pinned: false,
    body: DEFAULT_BODY,
  },
  {
    id: "notice-4",
    number: 4,
    title: "스마트톡 부착 방법 및 유의사항 (Phone Grip Guide)",
    author: "관리자",
    publishedAt: "2024-02-24T21:50:00+09:00",
    pinned: false,
    body: [
      "부착 면의 유분과 먼지를 제거한 뒤 눌러 고정해 주세요. 24시간 후 접착력이 가장 강해집니다.",
      "실리콘·가죽 등 일부 소재에는 부착이 어려울 수 있습니다.",
    ],
  },
];
