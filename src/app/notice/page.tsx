import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { NoticeBoard } from "@/features/notice/NoticeBoard";

export const metadata: Metadata = {
  title: "공지사항",
  description: "eatomato 배송·교환·이벤트 안내를 확인하세요.",
};

export default function NoticePage() {
  return (
    <SiteFrame>
      <NoticeBoard />
    </SiteFrame>
  );
}
