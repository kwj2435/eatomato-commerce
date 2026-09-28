import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminProductEdit } from "@/features/admin/products/AdminProductEdit";

export const metadata: Metadata = { title: "상품 수정" };

export default function AdminProductEditPage() {
  return (
    <Suspense>
      <AdminProductEdit />
    </Suspense>
  );
}
