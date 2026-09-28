import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminOrderList } from "@/features/admin/orders/AdminOrderList";

export const metadata: Metadata = { title: "주문·결제" };

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <AdminOrderList />
    </Suspense>
  );
}
