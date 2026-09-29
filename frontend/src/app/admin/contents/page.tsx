import type { Metadata } from "next";

import { AdminSiteContentManager } from "@/features/admin/content/AdminSiteContentManager";

export const metadata: Metadata = { title: "문구" };

export default function AdminContentsPage() {
  return <AdminSiteContentManager />;
}
