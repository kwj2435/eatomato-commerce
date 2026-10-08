import type { Metadata } from "next";

import { AdminCouponManager } from "@/features/admin/coupons/AdminCouponManager";

export const metadata: Metadata = { title: "쿠폰" };

export default function AdminCouponsPage() {
  return <AdminCouponManager />;
}
