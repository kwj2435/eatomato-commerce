"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import type { Notice } from "@/types/notice";

import { NoticeSearch } from "./NoticeSearch";
import { NoticeTable } from "./NoticeTable";

type NoticeBoardResultsProps = {
  /** 정렬까지 마친 공지 전체. 검색 필터는 이 컴포넌트가 클라이언트에서 수행한다. */
  notices: Notice[];
};

/**
 * 공지 목록 + 검색.
 *
 * 검색을 서버가 아니라 클라이언트에서 수행하는 이유:
 * 정적 배포(`output: "export"`)에서는 서버가 `searchParams` 를 읽을 수 없다.
 * 게시글 수가 적어 전량을 내려도 부담이 없고, 검색 입력이 이미 URL 쿼리를 갱신하는
 * 클라이언트 컴포넌트라 흐름도 자연스럽다.
 *
 * 실 API(페이징·서버 검색)를 붙일 때는 이 컴포넌트를 걷어내고
 * 서버에서 `listNotices({ query })` 를 호출하면 된다.
 */
export function NoticeBoardResults({ notices }: NoticeBoardResultsProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const filtered = useMemo(() => {
    const keyword = query.toLowerCase();
    if (!keyword) return notices;
    return notices.filter((n) => n.title.toLowerCase().includes(keyword));
  }, [notices, query]);

  return (
    <>
      <NoticeTable notices={filtered} />
      {/* key: URL 검색어가 바뀌면 입력 상태를 새 값으로 다시 마운트한다(뒤로가기 대응). */}
      <NoticeSearch key={query} currentQuery={query} />
    </>
  );
}
