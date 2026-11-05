import type { Metadata } from "next";

import { AdminAnalytics } from "@/features/admin/analytics/AdminAnalytics";

export const metadata: Metadata = { title: "방문자 분석" };

export default function AdminAnalyticsPage() {
  return <AdminAnalytics />;
}
