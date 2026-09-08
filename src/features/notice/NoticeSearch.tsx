"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type NoticeSearchProps = {
  /** 현재 URL 에 반영된 검색어. 입력값의 초기값이자 외부 변경의 동기화 기준. */
  currentQuery: string;
};

/**
 * 공지사항 검색 (시안 5p 하단 input + 버튼).
 *
 * SortSelect 와 동일하게 URL 쿼리(`?q=...`)를 진실의 원천으로 삼는다.
 * - 새로고침·공유·뒤로가기가 자연스럽게 동작하고
 * - 서버 컴포넌트가 쿼리를 읽어 그대로 API 에 넘기므로 목록 상태를 이중 관리하지 않는다.
 *
 * 입력 자체는 제출 전까지 로컬 상태다. 타이핑마다 라우팅하면 히스토리가 폭주하고
 * 서버 렌더가 불필요하게 반복되므로, 제출(엔터/버튼) 시점에만 `router.replace` 한다.
 *
 * URL 이 바뀌었을 때(뒤로가기 등) 입력값 동기화는 effect 대신 호출부의 `key` 로 처리한다.
 * effect 안에서 setState 하면 렌더가 한 번 더 도는 데다 React 의 권장 패턴도 아니다
 * (`react-hooks/set-state-in-effect`). 상태를 초기화하고 싶으면 key 로 다시 마운트하는 게 정석이다.
 */
export function NoticeSearch({ currentQuery }: NoticeSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [keyword, setKeyword] = useState(currentQuery);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const next = keyword.trim();
    const queryString = next ? new URLSearchParams({ q: next }).toString() : "";
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex items-center gap-2" role="search">
      <input
        type="text"
        aria-label="공지사항 검색"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="h-11 w-[220px] max-w-full border border-black bg-transparent px-3 text-[14px] tracking-[-0.2px] text-black outline-none placeholder:text-ink-placeholder focus:border-brand-primary"
      />
      <button
        type="submit"
        className="h-11 w-[68px] flex-none border border-black text-[14px] font-normal tracking-[-0.2px] text-black transition-colors hover:bg-black hover:text-white"
      >
        검색
      </button>
    </form>
  );
}
