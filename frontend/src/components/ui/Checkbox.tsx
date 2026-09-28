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
 * 시안이 네이티브 checkbox 대신 브랜드 컬러 사각 박스를 쓰므로 button 으로 구현한다.
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
        "flex h-[15px] w-[15px] flex-none items-center justify-center rounded-[3px] transition-colors",
        checked ? "bg-[#4F71EC] text-white" : "border border-[#B3A79C] bg-white text-transparent",
        className,
      )}
    >
      {checked ? <CheckIcon /> : null}
    </button>
  );
}
