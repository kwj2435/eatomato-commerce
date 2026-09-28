import type { Metadata } from "next";

import { AdminProductList } from "@/features/admin/products/AdminProductList";

export const metadata: Metadata = { title: "상품" };

export default function AdminProductsPage() {
  return <AdminProductList />;
}
