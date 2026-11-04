"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { SearchIcon } from "@/components/ui/icons";

type NoticeSearchProps = {
  /** 현재 URL 에 반영된 검색어. 입력값의 초기값이자 외부 변경의 동기화 기준. */
  currentQuery: string;
};

/**
 * 공지사항 제목 검색.
 *
 * SortSelect 와 동일하게 URL 쿼리(`?q=...`)를 진실의 원천으로 삼는다.
 * - 새로고침·공유·뒤로가기가 자연스럽게 동작하고
 * - 분류 칩(`?category=`)과 함께 써도 서로의 값을 지우지 않는다.
 *
 * 입력 자체는 제출 전까지 로컬 상태다. 타이핑마다 라우팅하면 히스토리가 폭주하므로
 * 제출(엔터/돋보기 버튼) 시점에만 `router.replace` 한다.
 *
 * URL 이 바뀌었을 때(뒤로가기 등) 입력값 동기화는 effect 대신 호출부의 `key` 로 처리한다
 * (`react-hooks/set-state-in-effect`).
 */
export function NoticeSearch({ currentQuery }: NoticeSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(currentQuery);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const next = keyword.trim();
    if (next) params.set("q", next);
    else params.delete("q");
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex h-[38px] w-full items-center border border-[#D9CFCC] bg-surface-elevated focus-within:border-ink-primary md:max-w-[280px]"
    >
      <button type="submit" aria-label="검색" className="flex h-full w-10 flex-none items-center justify-center text-ink-subtle">
        <SearchIcon width={16} height={16} />
      </button>
      <input
        type="search"
        aria-label="공지사항 제목 검색"
        placeholder="제목으로 검색"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent pr-3 text-[14px] tracking-[-0.2px] text-ink-primary outline-none placeholder:text-ink-placeholder"
      />
    </form>
  );
}
