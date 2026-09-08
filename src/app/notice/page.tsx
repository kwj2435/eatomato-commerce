import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { NoticeBoard } from "@/features/notice/NoticeBoard";

export const metadata: Metadata = {
  title: "공지사항",
  description: "eatomato 배송·교환·이벤트 안내를 확인하세요.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NoticePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const rawQuery = typeof sp.q === "string" ? sp.q : undefined;

  return (
    <SiteFrame>
      <NoticeBoard rawQuery={rawQuery} />
    </SiteFrame>
  );
}
