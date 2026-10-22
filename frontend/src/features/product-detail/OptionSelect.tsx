"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ChevronDownIcon, CloseIcon, SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import type { OptionChoice, OptionGroup } from "@/types/product-detail";

type OptionSelectProps = {
  group: OptionGroup;
  value: string | null;
  onChange: (choiceId: string) => void;
  /** true 면 옵션 라벨을 위에 별도 표기하지 않는다 (BETTER TOGETHER 안에서 사용). */
  hideLabel?: boolean;
  placeholder?: string;
};

/** 선택지가 이보다 많으면 목록 위에 검색창을 띄운다(기종 옵션 등). */
const SEARCH_THRESHOLD = 10;
/** 상세 페이지의 모바일/PC 경계(md)와 맞춘다. */
const MOBILE_QUERY = "(max-width: 767.98px)";

/** 기종명이 한글이라 영어로 입력해도 찾히도록 바꿔 비교한다. */
const SEARCH_ALIASES: Array<[RegExp, string]> = [
  [/iphone/g, "아이폰"],
  [/galaxy/g, "갤럭시"],
  [/pro/g, "프로"],
  [/max/g, "맥스"],
  [/plus/g, "플러스"],
  [/mini/g, "미니"],
  [/ultra/g, "울트라"],
  [/air/g, "에어"],
  [/edge/g, "엣지"],
  [/flip/g, "플립"],
  [/fold/g, "폴드"],
];

/** 대소문자·공백 무시 + 영어 별칭: "16pro" 로 "아이폰 16 프로" 를 찾는다. */
const normalize = (text: string) =>
  SEARCH_ALIASES.reduce(
    (acc, [pattern, korean]) => acc.replace(pattern, korean),
    text.toLowerCase().replace(/\s+/g, ""),
  );

/**
 * 상품 상세의 옵션 셀렉트.
 *
 * 네이티브 `<select>` 대신 커스텀 드롭다운으로 만든 이유:
 * - 시안이 셀렉트 항목마다 (+가격) 같은 부가 정보를 함께 노출하고 커스텀 여백을 요구한다.
 * - 정렬 셀렉트(`SortSelect`) 와 동일한 상호작용 규약(클릭 토글·외부 클릭·Escape) 을 재사용.
 *
 * 기종처럼 선택지가 수십 개인 옵션이 페이지를 길게 밀어내지 않도록:
 * - PC: 드롭다운 높이를 제한하고 안에서 스크롤한다.
 * - 모바일: 화면 아래에서 올라오는 시트로 띄운다(열려 있는 동안 body 스크롤 잠금).
 * - 선택지가 SEARCH_THRESHOLD 개를 넘으면 목록 위에 검색창을 둔다.
 *
 * 접근성: role="listbox" + option, aria-activedescendant 대신 aria-selected 만으로도 충분.
 */
export function OptionSelect({
  group,
  value,
  onChange,
  hideLabel,
  placeholder = "선택하세요.",
}: OptionSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // null: 닫힘. 열 때의 화면 폭으로 드롭다운/시트를 정한다.
  const [mode, setMode] = useState<"dropdown" | "sheet" | null>(null);
  const [query, setQuery] = useState("");
  const listboxId = useId();
  const labelId = useId();
  const open = mode !== null;

  const close = useCallback(() => {
    setMode(null);
    setQuery("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // 드롭다운: 바깥을 누르면 닫는다. 시트는 portal 이라 오버레이 클릭으로 닫는다.
  useEffect(() => {
    if (mode !== "dropdown") return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [mode, close]);

  useEffect(() => {
    if (mode !== "sheet") return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [mode]);

  // 열 때 이미 고른 항목이 보이도록 목록을 스크롤한다.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [open]);

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    setMode(window.matchMedia(MOBILE_QUERY).matches ? "sheet" : "dropdown");
  };

  const select = useCallback(
    (choice: OptionChoice) => {
      onChange(choice.id);
      close();
    },
    [onChange, close],
  );

  const selectedChoice = group.choices.find((c) => c.id === value) ?? null;
  const displayText = selectedChoice ? selectedChoice.label : placeholder;
  const searchable = group.choices.length > SEARCH_THRESHOLD;
  const needle = normalize(query);
  const visibleChoices = needle
    ? group.choices.filter((c) => normalize(c.label).includes(needle))
    : group.choices;

  const searchBox = searchable ? (
    <div className="flex items-center gap-2 border-b border-[#E1D9D6] px-2.5">
      <SearchIcon className="shrink-0 text-[#545454]" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`${group.label} 검색`}
        aria-label={`${group.label} 검색`}
        aria-controls={listboxId}
        // 모바일에서 바로 키보드가 올라오면 목록이 가려지므로 PC 에서만 자동 포커스.
        autoFocus={mode === "dropdown"}
        // iOS 는 16px 미만 입력창에 포커스하면 화면을 확대한다.
        className={cn(
          "h-11 w-full bg-transparent tracking-[-0.2px] text-black outline-none placeholder:text-[#9A9A9A]",
          mode === "sheet" ? "text-[16px]" : "text-[14px]",
        )}
      />
    </div>
  ) : null;

  const list = (
    <ul
      ref={listRef}
      id={listboxId}
      role="listbox"
      aria-label={group.label}
      className="flex flex-col"
    >
      {visibleChoices.map((choice) => {
        const selected = choice.id === value;
        return (
          <li key={choice.id} role="none">
            <button
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => select(choice)}
              className={cn(
                "flex w-full items-center px-2.5 text-left tracking-[-0.2px] transition-colors hover:bg-brand-highlight",
                mode === "sheet" ? "h-12 text-[14px]" : "h-11 text-[13px]",
                selected ? "font-semibold text-black" : "font-normal text-[#545454]",
              )}
            >
              {choice.label}
            </button>
          </li>
        );
      })}
      {visibleChoices.length === 0 ? (
        <li role="none" className="px-2.5 py-6 text-center text-[13px] text-[#9A9A9A]">
          검색 결과가 없습니다.
        </li>
      ) : null}
    </ul>
  );

  return (
    <div className="flex flex-col gap-2">
      {hideLabel ? null : (
        <span
          id={labelId}
          className="text-[14px] font-medium tracking-[-0.2px] text-[#545454]"
        >
          {group.label}
        </span>
      )}

      <div ref={rootRef} className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-labelledby={hideLabel ? undefined : labelId}
          onClick={toggle}
          className="flex h-[46px] w-full items-center justify-between gap-1.5 border border-[#545454] bg-surface-primary px-2.5 text-left"
        >
          <span
            className={cn(
              "text-[13px] font-normal tracking-[-0.2px]",
              selectedChoice ? "text-black" : "text-[#545454]",
            )}
          >
            {displayText}
          </span>
          <ChevronDownIcon
            className={cn(
              "text-[#545454] transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {mode === "dropdown" ? (
          <div className="absolute left-0 right-0 top-[46px] z-20 flex max-h-[320px] flex-col border border-[#545454] bg-surface-primary shadow-[0_8px_16px_rgba(33,33,33,0.06)]">
            {searchBox}
            <div className="overflow-y-auto overscroll-contain">{list}</div>
          </div>
        ) : null}
      </div>

      {mode === "sheet"
        ? createPortal(
            <div className="fixed inset-0 z-50">
              <div onClick={close} className="absolute inset-0 bg-black/40" />
              <div
                role="dialog"
                aria-modal="true"
                aria-label={group.label}
                className="absolute inset-x-0 bottom-0 flex max-h-[75dvh] flex-col bg-surface-primary pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(33,33,33,0.12)]"
              >
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E1D9D6] px-4">
                  <span className="text-[16px] font-semibold tracking-[-0.2px] text-black">
                    {group.label}
                  </span>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="닫기"
                    className="flex h-8 w-8 items-center justify-center text-[#545454]"
                  >
                    <CloseIcon />
                  </button>
                </div>
                {searchBox}
                <div className="overflow-y-auto overscroll-contain px-1.5 pb-2">{list}</div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
