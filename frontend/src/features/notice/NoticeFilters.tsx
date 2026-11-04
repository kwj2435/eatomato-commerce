import Link from "next/link";

import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import type { Notice } from "@/types/notice";

import { parseNoticeTitle } from "./notice-format";

export type NoticeCategoryCount = { name: string; count: number };

/** 말머리 분류와 글 수. 처음 나온 순서대로. */
export function countNoticeCategories(notices: Notice[]): NoticeCategoryCount[] {
  const counts = new Map<string, number>();
  for (const notice of notices) {
    const { category } = parseNoticeTitle(notice.title);
    if (category) counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts].map(([name, count]) => ({ name, count }));
}

type NoticeCategoryChipsProps = {
  total: number;
  categories: NoticeCategoryCount[];
  /** 선택된 분류. null 이면 전체. */
  active: string | null;
  /** 칩을 눌러도 검색어는 유지한다. */
  query: string;
};

/**
 * 분류 칩(전체 / 안내 / 이벤트 …). 훅을 쓰지 않아 정적 HTML(Suspense fallback)에서도 그대로 그린다.
 * 분류가 하나뿐이면 고를 의미가 없어 그리지 않는다.
 */
export function NoticeCategoryChips({ total, categories, active, query }: NoticeCategoryChipsProps) {
  if (categories.length < 2) return null;
  const href = (category: string | null) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (query) params.set("q", query);
    const qs = params.toString();
    // trailingSlash 설정에 맞춰 /notice/ 로 둔다(그렇지 않으면 한 번 리다이렉트된다).
    return qs ? `/notice/?${qs}` : "/notice/";
  };
  const chips = [{ name: null, label: "전체", count: total }, ...categories.map((c) => ({ name: c.name, label: c.name, count: c.count }))];

  return (
    <nav aria-label="공지 분류" className="flex flex-wrap gap-1.5">
      {chips.map((chip) => {
        const selected = chip.name === active;
        return (
          <Link
            key={chip.label}
            href={href(chip.name)}
            scroll={false}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "inline-flex h-[34px] items-center gap-1.5 border px-3.5 text-[13.5px] tracking-[-0.2px] transition-colors",
              selected
                ? "border-ink-primary bg-ink-primary font-semibold text-ink-inverse"
                : "border-[#D9CFCC] bg-surface-elevated text-ink-muted hover:border-ink-primary hover:text-ink-primary",
            )}
          >
            {chip.label}
            <span className="text-[12px] opacity-70">{chip.count}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** JS 가 뜨기 전(정적 HTML)에 보이는 검색창. 일반 GET 폼이라 JS 없이도 검색된다. */
export function NoticeSearchStatic() {
  return (
    <form
      action="/notice/"
      method="get"
      role="search"
      className="flex h-[38px] w-full items-center border border-[#D9CFCC] bg-surface-elevated md:max-w-[280px]"
    >
      <button type="submit" aria-label="검색" className="flex h-full w-10 flex-none items-center justify-center text-ink-subtle">
        <SearchIcon width={16} height={16} />
      </button>
      <input
        type="search"
        name="q"
        aria-label="공지사항 제목 검색"
        placeholder="제목으로 검색"
        className="h-full min-w-0 flex-1 bg-transparent pr-3 text-[14px] tracking-[-0.2px] text-ink-primary outline-none placeholder:text-ink-placeholder"
      />
    </form>
  );
}
