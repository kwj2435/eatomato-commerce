import type { BannerPlacement } from "./banner";
import type { CouponTerms } from "./benefit";
import type { Member, MemberRole } from "./member";
import type { Notice } from "./notice";
import type { Order, OrderStatus } from "./order";
import type { CategoryKey, ProductBadge, SubcategoryKey } from "./product";

/** 관리자 목록 공통 페이지 응답. */
export type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

// ── 대시보드 ──────────────────────────────────────────────

export type Sales = { orders: number; revenue: number };

/** 마케팅 인사이트 리포트(Python 에이전트가 만든 JSON). */
export type InsightConfidence = "high" | "medium" | "low";

export type InsightReport = {
  headline: string;
  period: string;
  insights: {
    title: string;
    finding: string;
    evidence: { metric: string; value: string }[];
    confidence: InsightConfidence;
    sample_note: string;
  }[];
  actions: {
    priority: number;
    action: string;
    reason: string;
    expected_effect: string;
    effort: "low" | "medium" | "high";
  }[];
  data_gaps: string[];
  /** 근거 숫자가 도구 결과에 실제로 있는지 에이전트가 확인한 결과. */
  verification?: {
    checked: number;
    unverified: { metric: string; value: string; numbers_not_in_tool_results: string[] }[];
  };
};

export type InsightTraceStep = {
  turn: number;
  tool: string;
  input: Record<string, unknown>;
  ms?: number;
  preview?: string;
  error?: string;
};

export type InsightRunStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED";

/** 인사이트 분석 실행. report·trace 는 상세 조회에만 온다. question 이 없으면 주간 리포트. */
export type InsightRun = {
  id: number;
  question?: string;
  status: InsightRunStatus;
  report?: InsightReport;
  trace?: InsightTraceStep[];
  error?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  toolCalls?: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
};

/** 운영 브리핑 할 일 단계. 긴급 → 확인 → 참고 순으로 온다. */
export type BriefingLevel = "URGENT" | "WARNING" | "INFO";

export type BriefingItem = {
  level: BriefingLevel;
  /** 항목 종류(PAID_WAITING, LOW_STOCK 등). */
  kind: string;
  title: string;
  detail?: string;
  /** 바로 갈 화면. /admin 으로 시작하면 관리자 화면, 아니면 스토어. */
  link?: string;
};

/** 하루 실적. 주문·매출은 결제가 끝난 주문, 방문자는 페이지 조회 기준. */
export type BriefingDay = { date: string; orders: number; revenue: number; visitors: number };

/** 관리자 대시보드 맨 위의 오늘의 브리핑. */
export type Briefing = {
  generatedAt: string;
  yesterday: BriefingDay;
  sameDayLastWeek: BriefingDay;
  items: BriefingItem[];
};

export type Dashboard = {
  today: Sales;
  thisMonth: Sales;
  allTime: Sales;
  totalMembers: number;
  newMembersToday: number;
  onSaleProducts: number;
  hiddenProducts: number;
  ordersByStatus: Record<OrderStatus, number>;
  /** 최근 14일, 오래된 날부터. 주문 없는 날도 0 으로 채워져 온다. */
  dailySales: Array<{ date: string; orders: number; revenue: number }>;
  topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number }>;
  recentOrders: AdminOrder[];
  /** 재고를 관리하는 상품 중 품절 수. */
  soldOutProducts: number;
};

// ── 방문자 분석 ──────────────────────────────────────────

export type VisitTotals = { visitors: number; sessions: number; pageViews: number };

export type PageType =
  | "HOME" | "CATEGORY" | "PRODUCT" | "SEARCH" | "CART" | "CHECKOUT" | "MYPAGE" | "NOTICE" | "LOGIN" | "OTHER";

/**
 * 방문자 = 서로 다른 브라우저 수, 방문 = 30분 넘게 쉬지 않고 이어진 조회 묶음, 조회 = 페이지를 연 횟수.
 * 관리자 화면·관리자 계정·검색 로봇은 세지 않는다.
 */
export type Analytics = {
  days: number;
  today: VisitTotals;
  /** 어제 같은 시각까지. */
  yesterdaySameTime: VisitTotals;
  range: VisitTotals;
  /** 최근 5분 안에 페이지를 연 방문자 수. */
  liveVisitors: number;
  /** 오래된 날부터, 빈 날도 0 으로 채워져 온다. */
  daily: Array<{ date: string } & VisitTotals>;
  /** 오늘 0~23시. */
  hourlyToday: Array<{ hour: number; visitors: number; pageViews: number }>;
  topPages: Array<{ path: string; pageType: PageType; productName: string | null; views: number; visitors: number }>;
  topProducts: Array<{
    productId: string;
    slug: string;
    name: string;
    imageUrl: string | null;
    views: number;
    visitors: number;
    /** 기간 안에 결제가 끝난 주문의 판매 수량. */
    purchased: number;
  }>;
  /** key 가 null 이면 직접 방문. count 는 방문 수. */
  referrers: Array<{ key: string | null; count: number }>;
  /** key: MOBILE·TABLET·DESKTOP, count 는 방문자 수. */
  devices: Array<{ key: string; count: number }>;
  /** 구매 단계(방문 기준). purchases·revenue 는 결제 완료 주문 수·금액. */
  funnel: {
    sessions: number;
    productSessions: number;
    cartSessions: number;
    checkoutPageSessions: number;
    checkoutStartSessions: number;
    purchaseSessions: number;
    purchases: number;
    revenue: number;
  };
  /** 링크 ?from= 캠페인별 성과(많이 들어온 순 20개). */
  campaigns: Array<{
    campaign: string;
    sessions: number;
    productSessions: number;
    cartSessions: number;
    purchaseSessions: number;
    revenue: number;
  }>;
};

// ── 상품 ──────────────────────────────────────────────────

export type AdminProductSummary = {
  id: string;
  slug: string;
  name: string;
  categoryCode: CategoryKey;
  subcategoryCode: SubcategoryKey | null;
  price: number;
  salePrice: number | null;
  imageUrl: string | null;
  visible: boolean;
  /** 재고. null 이면 재고 관리 안 함(무제한). */
  stockQuantity: number | null;
  soldOut: boolean;
  badges: ProductBadge[];
  salesCount: number;
  rating: number;
  createdAt: string;
};

export type AdminOptionGroup = {
  code: string;
  label: string;
  choices: Array<{ code: string; label: string; priceDelta: number }>;
};

/** 등록·수정 요청 본문이자 수정 폼의 값. */
export type AdminProductInput = {
  slug: string;
  name: string;
  optionSummary: string;
  /** 한글 검색어(쉼표 구분). 스토어 검색에만 쓰고 화면에는 안 보인다. */
  searchKeywords: string;
  price: number;
  salePrice: number | null;
  imageUrl: string;
  hoverImageUrl: string;
  categoryCode: string;
  subcategoryCode: string;
  rewardRate: number;
  /** 재고. null 이면 재고 관리 안 함(무제한). */
  stockQuantity: number | null;
  noticeText: string;
  shippingText: string;
  visible: boolean;
  badges: ProductBadge[];
  detailImages: string[];
  optionGroups: AdminOptionGroup[];
  relatedProductIds: string[];
};

export type AdminProduct = Omit<
  AdminProductInput,
  "optionSummary" | "searchKeywords" | "imageUrl" | "hoverImageUrl" | "subcategoryCode" | "noticeText" | "shippingText"
> & {
  id: string;
  optionSummary: string | null;
  searchKeywords: string | null;
  imageUrl: string | null;
  hoverImageUrl: string | null;
  subcategoryCode: string | null;
  noticeText: string | null;
  shippingText: string | null;
  salesCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string | null;
};

// ── 회원 ──────────────────────────────────────────────────

export type AdminMemberSummary = {
  id: string;
  loginId: string;
  name: string;
  email: string;
  phone: string | null;
  grade: string;
  role: MemberRole;
  enabled: boolean;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
};

export type AdminMemberDetail = {
  summary: AdminMemberSummary;
  profile: Member;
  recentOrders: AdminOrder[];
  /** 재고를 관리하는 상품 중 품절 수. */
  soldOutProducts: number;
};

// ── 주문 ──────────────────────────────────────────────────

export type AdminOrder = Order & {
  member: { id: string; loginId: string; name: string } | null;
  /** 비회원 주문의 주문자. 회원 주문이면 없다. */
  guest?: { name: string; phone: string; email: string };
  /** 관리자가 지금 바꿀 수 있는 다음 상태. 비어 있으면 더 바꿀 수 없다. 배송중은 송장이 있어야 바뀐다. */
  nextStatuses: OrderStatus[];
  /** 택배사·송장번호. 입력 전이면 없다. */
  courier?: string;
  trackingNumber?: string;
  payment?: {
    provider: string;
    status: "READY" | "WAITING_FOR_DEPOSIT" | "DONE" | "CANCELED" | "FAILED";
    paymentKey?: string;
    amount: number;
    approvedAt?: string;
  };
};

// ── 배너·공지 ─────────────────────────────────────────────

export type AdminBanner = {
  id: string;
  placement: BannerPlacement;
  /** BEST_PICK 은 빈 문자열(링크 없음). */
  href: string;
  imageUrl: string;
  /** 모바일 전용 이미지. 비어 있으면 모바일에서도 imageUrl 을 쓴다. */
  mobileImageUrl: string | null;
  alt: string;
  sortOrder: number;
  active: boolean;
};

export type AdminBannerInput = Omit<AdminBanner, "id">;

export type AdminNoticeInput = {
  number: number | null;
  title: string;
  author: string;
  publishedAt: string | null;
  pinned: boolean;
  body: string[];
};

export type AdminNotice = Notice;

// ── 쿠폰 ──────────────────────────────────────────────────

export type AdminCoupon = CouponTerms & {
  id: string;
  name: string;
  /** 발급일부터 며칠. */
  validDays?: number;
  /** 이 시각까지(종료일 23:59:59). validDays 와 같이 있으면 이른 쪽. */
  validUntil?: string;
  issueOnSignup: boolean;
  /** false 면 발급 중지(이미 받은 쿠폰은 기한까지 쓸 수 있다). */
  active: boolean;
  /** 지금 새로 발급할 수 있는지(발급 중 + 종료일 전). */
  issuable: boolean;
  issuedCount: number;
  usedCount: number;
  createdAt: string;
};

export type AdminCouponInput = CouponTerms & {
  name: string;
  validDays?: number;
  /** yyyy-MM-dd */
  validUntil?: string;
  issueOnSignup: boolean;
};
