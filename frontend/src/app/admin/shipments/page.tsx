import type { Metadata } from "next";

import { AdminShipmentList } from "@/features/admin/orders/AdminShipmentList";

export const metadata: Metadata = { title: "배송 준비" };

export default function AdminShipmentsPage() {
  return <AdminShipmentList />;
}
