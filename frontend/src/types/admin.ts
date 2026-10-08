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
  "optionSummary" | "imageUrl" | "hoverImageUrl" | "subcategoryCode" | "noticeText" | "shippingText"
> & {
  id: string;
  optionSummary: string | null;
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
  /** 관리자가 지금 바꿀 수 있는 다음 상태. 비어 있으면 더 바꿀 수 없다. */
  nextStatuses: OrderStatus[];
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
