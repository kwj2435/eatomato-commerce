import type { Metadata } from "next";

import { AdminInsights } from "@/features/admin/insights/AdminInsights";

export const metadata: Metadata = { title: "마케팅 인사이트" };

export default function AdminInsightsPage() {
  return <AdminInsights />;
}
