"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { SearchIcon } from "@/components/ui/icons";

type SearchInputProps = {
  /** 현재 URL 에 반영된 검색어. 입력의 초기값이다. */
  currentQuery: string;
};

/**
 * 상품 검색 입력.
 *
 * NoticeSearch 와 동일하게 URL 쿼리(`?q=...`)를 진실의 원천으로 삼는다.
 * 정렬(`sort`)은 그대로 보존해 검색어만 바꿔도 정렬이 초기화되지 않게 한다.
 *
 * URL 이 바뀌었을 때의 입력값 동기화는 effect 가 아니라 호출부의 `key` 로 처리한다.
 */
export function SearchInput({ currentQuery }: SearchInputProps) {
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
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="mx-auto flex w-full max-w-[520px] items-center gap-2"
    >
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-icon">
          <SearchIcon />
        </span>
        <input
          type="text"
          aria-label="상품 검색"
          placeholder="찾으시는 상품을 입력해 주세요"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="h-[52px] w-full border border-black bg-transparent pl-12 pr-3.5 text-[15px] tracking-[-0.2px] text-black outline-none placeholder:text-ink-placeholder focus:border-brand-primary"
        />
      </div>
      <button
        type="submit"
        className="h-[52px] w-[88px] flex-none border border-black text-[15px] tracking-[-0.2px] text-black transition-colors hover:bg-black hover:text-white"
      >
        검색
      </button>
    </form>
  );
}
