import type { Metadata } from "next";

import { AdminShippingPolicy } from "@/features/admin/content/AdminShippingPolicy";

export const metadata: Metadata = { title: "배송비" };

export default function AdminShippingPage() {
  return <AdminShippingPolicy />;
}
