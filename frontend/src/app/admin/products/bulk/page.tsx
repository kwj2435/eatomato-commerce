import type { Metadata } from "next";

import { AdminProductBulk } from "@/features/admin/products/AdminProductBulk";

export const metadata: Metadata = { title: "상품 일괄 등록" };

export default function AdminProductBulkPage() {
  return <AdminProductBulk />;
}
