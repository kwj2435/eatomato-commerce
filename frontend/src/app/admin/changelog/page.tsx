import type { Metadata } from "next";

import { AdminChangelog } from "@/features/admin/changelog/AdminChangelog";

export const metadata: Metadata = { title: "업데이트 이력" };

export default function AdminChangelogPage() {
  return <AdminChangelog />;
}
