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
};

// ── 주문 ──────────────────────────────────────────────────

export type AdminOrder = Order & {
  member: { id: string; loginId: string; name: string } | null;
};

// ── 배너·공지 ─────────────────────────────────────────────

export type AdminBanner = {
  id: string;
  captionLines: string[];
  href: string;
  imageUrl: string | null;
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
