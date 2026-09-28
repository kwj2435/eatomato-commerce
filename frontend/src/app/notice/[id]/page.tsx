import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { NoticeDetail } from "@/features/notice/NoticeDetail";
import { getNotice, listNoticeIds } from "@/lib/api/notices";

type RouteParams = { id: string };
type PageProps = { params: Promise<RouteParams> };

export async function generateStaticParams(): Promise<RouteParams[]> {
  return (await listNoticeIds()).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const notice = await getNotice(id);

  return notice
    ? { title: notice.title, description: notice.body[0] }
    : { title: "공지사항을 찾을 수 없습니다" };
}

export default async function NoticeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const notice = await getNotice(id);

  if (!notice) notFound();

  return (
    <SiteFrame>
      <NoticeDetail notice={notice} />
    </SiteFrame>
  );
}
