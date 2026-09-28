import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminShell } from "@/features/admin/AdminShell";

export const metadata: Metadata = {
  title: { default: "관리자", template: "%s · eatomato 관리자" },
  robots: { index: false, follow: false },
};

/** 관리자 화면은 스토어프론트 헤더·푸터(SiteFrame) 없이 자체 셸을 쓴다. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
