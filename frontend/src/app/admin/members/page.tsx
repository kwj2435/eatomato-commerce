import type { Metadata } from "next";

import { AdminMemberList } from "@/features/admin/members/AdminMemberList";

export const metadata: Metadata = { title: "회원" };

export default function AdminMembersPage() {
  return <AdminMemberList />;
}
