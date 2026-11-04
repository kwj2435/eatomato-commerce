import Link from "next/link";

import { cn } from "@/lib/utils/cn";
import { formatNoticeDay } from "@/lib/utils/format";
import type { Notice } from "@/types/notice";

import { parseNoticeTitle } from "./notice-format";
import { NoticeTag } from "./NoticeTag";

/**
 * 공지사항 목록.
 *
 * 예전에는 4열 표(번호 / 제목 / 글쓴이 / 등록일, 최소 720px)라 모바일에서 화면 밖으로 넘쳤다.
 * 글쓴이는 항상 "관리자"라 빼고, 한 줄에 [태그 | 제목 | 날짜] 를 둔다.
 * md 미만에서는 같은 마크업을 세로로 쌓아(태그 → 제목 → 날짜) 가로 스크롤 없이 모두 보인다.
 */
export function NoticeList({ notices }: { notices: Notice[] }) {
  if (notices.length === 0) {
    return (
      <p className="flex h-[200px] items-center justify-center border-t-[1.5px] border-ink-primary text-[15px] tracking-[-0.2px] text-ink-muted">
        검색 결과가 없습니다.
      </p>
    );
  }

  return (
    <ul className="border-t-[1.5px] border-ink-primary">
      {notices.map((notice) => {
        const { category, title } = parseNoticeTitle(notice.title);
        return (
          <li key={notice.id}>
            <Link
              href={`/notice/${notice.id}`}
              className={cn(
                "group grid grid-cols-[minmax(0,1fr)] gap-1.5 border-b border-[#F0E2DE] px-1 py-4 transition-colors md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-3.5 md:px-2 md:py-[18px]",
                notice.pinned ? "bg-brand-highlight/45" : "hover:bg-black/[0.02]",
              )}
            >
              <span className="flex gap-1.5">
                {notice.pinned ? <NoticeTag kind="pinned" /> : null}
                {category ? <NoticeTag kind="category" label={category} /> : null}
              </span>
              <span
                className={cn(
                  "break-keep text-[15px] tracking-[-0.2px] text-ink-primary underline-offset-2 group-hover:underline md:truncate",
                  notice.pinned && "font-semibold",
                )}
              >
                {title}
              </span>
              <time dateTime={notice.publishedAt} className="whitespace-nowrap text-[13px] text-ink-subtle">
                {formatNoticeDay(notice.publishedAt)}
              </time>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
