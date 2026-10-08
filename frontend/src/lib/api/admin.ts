import type {
  AdminBanner,
  AdminBannerInput,
  AdminCoupon,
  AdminCouponInput,
  AdminMemberDetail,
  AdminMemberSummary,
  AdminNotice,
  AdminNoticeInput,
  AdminOrder,
  AdminProduct,
  AdminProductInput,
  AdminProductSummary,
  Dashboard,
  Page,
} from "@/types/admin";
import type { MemberRole } from "@/types/member";
import type { OrderStatus } from "@/types/order";

import { apiFetch } from "./client";

/** 관리자 API. 모두 관리자 토큰이 필요하다(브라우저 전용). */

function query(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const text = qs.toString();
  return text ? `?${text}` : "";
}

export const getDashboard = () => apiFetch<Dashboard>("/api/admin/dashboard", { auth: true });

// ── 상품 ──

export const listAdminProducts = (params: { q?: string; category?: string; page?: number }) =>
  apiFetch<Page<AdminProductSummary>>(`/api/admin/products${query(params)}`, { auth: true });

export const listAllAdminProducts = () =>
  apiFetch<AdminProductSummary[]>("/api/admin/products/all", { auth: true });

export const getAdminProduct = (id: string) =>
  apiFetch<AdminProduct>(`/api/admin/products/${id}`, { auth: true });

/** 폼 값 → 요청 본문. 숫자 id 문자열을 서버가 받는 number 로 바꾼다. */
function productBody(input: AdminProductInput) {
  return { ...input, relatedProductIds: input.relatedProductIds.map(Number) };
}

export const createAdminProduct = (input: AdminProductInput) =>
  apiFetch<AdminProduct>("/api/admin/products", { method: "POST", auth: true, json: productBody(input) });

export const updateAdminProduct = (id: string, input: AdminProductInput) =>
  apiFetch<AdminProduct>(`/api/admin/products/${id}`, { method: "PUT", auth: true, json: productBody(input) });

export const setAdminProductVisible = (id: string, visible: boolean) =>
  apiFetch<void>(`/api/admin/products/${id}/visible`, { method: "PATCH", auth: true, json: { visible } });

export const setAdminProductStock = (id: string, stockQuantity: number | null) =>
  apiFetch<AdminProductSummary>(`/api/admin/products/${id}/stock`, {
    method: "PATCH",
    auth: true,
    json: { stockQuantity },
  });

/** 선택 상품 할인율 일괄 조정. rate=0 이면 할인 해제. 할인가는 roundingUnit 원 단위로 버린다. */
export const setAdminProductsDiscount = (productIds: string[], rate: number, roundingUnit: 1 | 10 | 100) =>
  apiFetch<AdminProductSummary[]>("/api/admin/products/discount", {
    method: "PATCH",
    auth: true,
    json: { productIds: productIds.map(Number), rate, roundingUnit },
  });

export const deleteAdminProduct = (id: string) =>
  apiFetch<void>(`/api/admin/products/${id}`, { method: "DELETE", auth: true });

// ── 회원 ──

export const listAdminMembers = (params: { q?: string; role?: MemberRole | ""; page?: number }) =>
  apiFetch<Page<AdminMemberSummary>>(`/api/admin/members${query(params)}`, { auth: true });

export const getAdminMember = (id: string) =>
  apiFetch<AdminMemberDetail>(`/api/admin/members/${id}`, { auth: true });

export const updateAdminMember = (
  id: string,
  patch: { grade?: string; role?: MemberRole; enabled?: boolean },
) => apiFetch<AdminMemberDetail>(`/api/admin/members/${id}`, { method: "PATCH", auth: true, json: patch });

// ── 주문 ──

export const listAdminOrders = (params: { status?: OrderStatus | ""; q?: string; page?: number; size?: number }) =>
  apiFetch<Page<AdminOrder>>(`/api/admin/orders${query(params)}`, { auth: true });

/** 한 상태의 주문을 페이지를 넘겨 가며 모두 모은다(배송 준비용). 최대 2,000건. */
export async function listAllAdminOrders(status: OrderStatus): Promise<AdminOrder[]> {
  const all: AdminOrder[] = [];
  for (let page = 0; page < 20; page++) {
    const data = await listAdminOrders({ status, page, size: 100 });
    all.push(...data.content);
    if (page >= data.totalPages - 1) break;
  }
  return all;
}

/** 무통장입금으로 입금까지 끝난 주문을 취소할 때 고객 환불 계좌. bank 는 토스 은행 코드. */
export type RefundAccount = { bank: string; accountNumber: string; holderName: string };

export const changeAdminOrderStatus = (orderNumber: string, status: OrderStatus, refundAccount?: RefundAccount) =>
  apiFetch<AdminOrder>(`/api/admin/orders/${orderNumber}/status`, {
    method: "PATCH",
    auth: true,
    json: { status, refundAccount },
  });

// ── 배너 ──

export const listAdminBanners = () => apiFetch<AdminBanner[]>("/api/admin/banners", { auth: true });

export const createAdminBanner = (input: AdminBannerInput) =>
  apiFetch<AdminBanner>("/api/admin/banners", { method: "POST", auth: true, json: input });

export const updateAdminBanner = (id: string, input: AdminBannerInput) =>
  apiFetch<AdminBanner>(`/api/admin/banners/${id}`, { method: "PUT", auth: true, json: input });

export const deleteAdminBanner = (id: string) =>
  apiFetch<void>(`/api/admin/banners/${id}`, { method: "DELETE", auth: true });

// ── 공지 ──

export const listAdminNotices = () => apiFetch<AdminNotice[]>("/api/admin/notices", { auth: true });

export const createAdminNotice = (input: AdminNoticeInput) =>
  apiFetch<AdminNotice>("/api/admin/notices", { method: "POST", auth: true, json: input });

export const updateAdminNotice = (id: string, input: AdminNoticeInput) =>
  apiFetch<AdminNotice>(`/api/admin/notices/${id}`, { method: "PUT", auth: true, json: input });

export const deleteAdminNotice = (id: string) =>
  apiFetch<void>(`/api/admin/notices/${id}`, { method: "DELETE", auth: true });

// ── 이미지 업로드 ──

export async function uploadAdminImage(file: File, category: "products" | "banners"): Promise<string> {
  const form = new FormData();
  form.set("file", file);
  const res = await apiFetch<{ url: string }>(`/api/admin/uploads${query({ category })}`, {
    method: "POST",
    auth: true,
    body: form,
  });
  return res.url;
}

// ── 쿠폰 ──

export const listAdminCoupons = () => apiFetch<AdminCoupon[]>("/api/admin/coupons", { auth: true });

export const createAdminCoupon = (input: AdminCouponInput) =>
  apiFetch<AdminCoupon>("/api/admin/coupons", { method: "POST", auth: true, json: input });

/** 발급 중지/재개, 가입 자동 발급 켜기/끄기. */
export const updateAdminCoupon = (id: string, patch: { active?: boolean; issueOnSignup?: boolean }) =>
  apiFetch<AdminCoupon>(`/api/admin/coupons/${id}`, { method: "PATCH", auth: true, json: patch });

/** all 이면 이용 중인 일반 회원 전체, 아니면 loginIds 의 회원. 이미 받은 회원은 건너뛴다. */
export const issueAdminCoupon = (id: string, target: { all: true } | { all: false; loginIds: string[] }) =>
  apiFetch<{ issued: number; notFound: string[] }>(`/api/admin/coupons/${id}/issue`, {
    method: "POST",
    auth: true,
    json: target,
  });
