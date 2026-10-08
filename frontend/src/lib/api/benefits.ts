import type { MemberCoupon, Points } from "@/types/benefit";

import { apiFetch } from "./client";

/** 내 쿠폰 전체(사용 가능·사용함·기한 지남). */
export async function listMyCoupons(): Promise<MemberCoupon[]> {
  return apiFetch<MemberCoupon[]>("/api/me/coupons", { auth: true });
}

/** 내 적립금 잔액과 최근 내역. */
export async function getMyPoints(): Promise<Points> {
  return apiFetch<Points>("/api/me/points", { auth: true });
}
