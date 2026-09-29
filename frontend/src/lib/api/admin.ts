import type {
  AdminBanner,
  AdminBannerInput,
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

export const changeAdminOrderStatus = (orderNumber: string, status: OrderStatus) =>
  apiFetch<AdminOrder>(`/api/admin/orders/${orderNumber}/status`, {
    method: "PATCH",
    auth: true,
    json: { status },
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
