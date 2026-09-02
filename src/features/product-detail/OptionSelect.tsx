"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { ChevronDownIcon } from "@/components/ui/icons";
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

/**
 * 상품 상세의 옵션 셀렉트.
 *
 * 네이티브 `<select>` 대신 커스텀 드롭다운으로 만든 이유:
 * - 시안이 셀렉트 항목마다 (+가격) 같은 부가 정보를 함께 노출하고 커스텀 여백을 요구한다.
 * - 정렬 셀렉트(`SortSelect`) 와 동일한 상호작용 규약(클릭 토글·외부 클릭·Escape) 을 재사용.
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
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const labelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = useCallback(
    (choice: OptionChoice) => {
      onChange(choice.id);
      setOpen(false);
    },
    [onChange],
  );

  const selectedChoice = group.choices.find((c) => c.id === value) ?? null;
  const displayText = selectedChoice ? selectedChoice.label : placeholder;

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
          onClick={() => setOpen((v) => !v)}
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

        {open ? (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={group.label}
            className="absolute left-0 right-0 top-[46px] z-20 flex flex-col border border-[#545454] bg-surface-primary shadow-[0_8px_16px_rgba(33,33,33,0.06)]"
          >
            {group.choices.map((choice) => {
              const selected = choice.id === value;
              return (
                <li key={choice.id} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => select(choice)}
                    className={cn(
                      "flex h-11 w-full items-center px-2.5 text-left text-[13px] tracking-[-0.2px] transition-colors hover:bg-brand-highlight",
                      selected ? "font-semibold text-black" : "font-normal text-[#545454]",
                    )}
                  >
                    {choice.label}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
