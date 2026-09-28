import type { Metadata } from "next";

import { AdminNoticeManager } from "@/features/admin/content/AdminNoticeManager";

export const metadata: Metadata = { title: "공지" };

export default function AdminNoticesPage() {
  return <AdminNoticeManager />;
}
