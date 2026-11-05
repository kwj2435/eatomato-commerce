import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { NoticeDetail } from "@/features/notice/NoticeDetail";
import { getNotice, listNoticeIds, listNotices } from "@/lib/api/notices";

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
    ? { title: notice.title, description: notice.body[0], alternates: { canonical: `/notice/${id}/` } }
    : { title: "공지사항을 찾을 수 없습니다" };
}

export default async function NoticeDetailPage({ params }: PageProps) {
  const { id } = await params;
  // 이전·다음 글은 목록 순서(고정 공지 → 최신순)를 따른다. 목록을 못 불러와도 본문은 보여 준다.
  const [notice, all] = await Promise.all([getNotice(id), listNotices().catch(() => [])]);

  if (!notice) notFound();

  const index = all.findIndex((n) => n.id === notice.id);
  const prev = index > 0 ? all[index - 1] : null;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  return (
    <SiteFrame>
      <NoticeDetail notice={notice} prev={prev} next={next} />
    </SiteFrame>
  );
}
