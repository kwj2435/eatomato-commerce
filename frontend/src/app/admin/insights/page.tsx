import type { Metadata } from "next";

import { AdminInsights } from "@/features/admin/insights/AdminInsights";

export const metadata: Metadata = { title: "개선 제안" };

export default function AdminInsightsPage() {
  return <AdminInsights />;
}
