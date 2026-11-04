"use client";

import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label: string;
  className?: string;
};

/**
 * 커스텀 체크박스.
 *
 * 시안이 네이티브 checkbox 대신 각진 사각 박스를 쓰므로 button 으로 구현한다.
 * 색은 사이트 팔레트(검정)에 맞춘다. 예전 파란색(#4F71EC)은 팔레트 밖이라 걷어 냈다.
 * - 접근성: role="checkbox" + aria-checked + 키보드 스페이스/엔터로 토글
 * - 라벨은 aria-label 로 스크린리더에 전달
 */
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  className,
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex h-[18px] w-[18px] flex-none items-center justify-center border-[1.5px] border-ink-primary transition-colors",
        checked ? "bg-ink-primary text-ink-inverse" : "bg-surface-elevated text-transparent",
        className,
      )}
    >
      {checked ? <CheckIcon /> : null}
    </button>
  );
}
