import type { Metadata } from "next";

import { AdminBannerManager } from "@/features/admin/content/AdminBannerManager";

export const metadata: Metadata = { title: "배너" };

export default function AdminBannersPage() {
  return <AdminBannerManager />;
}
