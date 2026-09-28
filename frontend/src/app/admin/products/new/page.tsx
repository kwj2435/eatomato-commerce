import type { Metadata } from "next";

import { AdminProductForm } from "@/features/admin/products/AdminProductForm";

export const metadata: Metadata = { title: "상품 등록" };

export default function AdminProductNewPage() {
  return <AdminProductForm />;
}
