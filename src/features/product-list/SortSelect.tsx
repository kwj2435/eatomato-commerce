"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import type { SortValue } from "@/lib/api/products";
import { SORT_OPTIONS } from "@/lib/api/products";

type SortSelectProps = {
  currentSort: SortValue;
};

/**
 * 정렬 셀렉트.
 *
 * URL 쿼리(`?sort=...`)를 진실의 원천으로 삼는다.
 * - 새로고침·공유·뒤로가기가 자연스럽게 동작
 * - 서버 컴포넌트가 쿼리를 읽어 그대로 API 호출에 넘기므로 클라이언트 상태를 이중 관리하지 않는다
 *
 * 상호작용:
 * - 버튼 클릭으로 열고 닫는다(hover 는 터치 기기에서 실패한다).
 * - 바깥 클릭·Escape 로 닫힌다.
 * - 옵션 선택 시 `router.replace` 로 쿼리를 갱신해 히스토리 폭주를 막는다.
 */
export function SortSelect({ currentSort }: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;

    const onDocumentPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocumentPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocumentPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectSort = useCallback(
    (next: SortValue) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("sort", next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      setOpen(false);
    },
    [pathname, router, searchParams],
  );

  const currentLabel = SORT_OPTIONS.find((o) => o.value === currentSort)!.label;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-[35px] w-[116px] items-center justify-between gap-1.5 border border-[#7A7A7A] bg-white px-2.5 text-black"
      >
        <span className="whitespace-nowrap text-[14px] font-medium leading-[20px] tracking-[-0.2px]">
          {currentLabel}
        </span>
        <ChevronDownIcon
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="정렬 옵션"
          className="absolute right-0 top-[35px] z-20 flex w-[116px] flex-col border border-[#888888] bg-white shadow-[0_8px_16px_rgba(33,33,33,0.08)]"
        >
          {SORT_OPTIONS.map((option) => {
            const selected = option.value === currentSort;
            return (
              <li key={option.value} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectSort(option.value)}
                  className={cn(
                    "block w-full px-2.5 py-[5px] text-left text-[13px] leading-[17px] tracking-[-0.3px] text-black transition-colors hover:bg-brand-tint",
                    selected ? "font-bold" : "font-normal",
                  )}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
