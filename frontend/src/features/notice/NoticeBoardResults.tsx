"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import type { Notice } from "@/types/notice";

import { NoticeCategoryChips, countNoticeCategories } from "./NoticeFilters";
import { NoticeList } from "./NoticeList";
import { NoticeSearch } from "./NoticeSearch";
import { parseNoticeTitle } from "./notice-format";

type NoticeBoardResultsProps = {
  /** 정렬까지 마친 공지 전체. 분류·검색 필터는 이 컴포넌트가 클라이언트에서 수행한다. */
  notices: Notice[];
};

/**
 * 공지 분류 칩 + 검색 + 목록.
 *
 * 필터를 서버가 아니라 클라이언트에서 수행하는 이유:
 * 목록 페이지는 정적으로 만들어 두고(60초마다 갱신) URL 쿼리(`?category=`, `?q=`)는 브라우저에서 읽는다.
 * 게시글 수가 적어 전량을 내려도 부담이 없다.
 */
export function NoticeBoardResults({ notices }: NoticeBoardResultsProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const categories = useMemo(() => countNoticeCategories(notices), [notices]);
  const requested = searchParams.get("category");
  // 없는 분류가 주소에 들어오면 전체로 본다.
  const active = requested && categories.some((c) => c.name === requested) ? requested : null;

  const filtered = useMemo(() => {
    const keyword = query.toLowerCase();
    return notices.filter((n) => {
      if (active && parseNoticeTitle(n.title).category !== active) return false;
      return !keyword || n.title.toLowerCase().includes(keyword);
    });
  }, [notices, query, active]);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <NoticeCategoryChips total={notices.length} categories={categories} active={active} query={query} />
        {/* key: URL 검색어가 바뀌면 입력 상태를 새 값으로 다시 마운트한다(뒤로가기 대응). */}
        <NoticeSearch key={query} currentQuery={query} />
      </div>
      <div className="mt-4">
        <NoticeList notices={filtered} />
      </div>
      <p className="mt-3.5 text-[12.5px] text-ink-subtle">총 {filtered.length}개의 글</p>
    </>
  );
}
