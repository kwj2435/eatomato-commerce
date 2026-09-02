"use client";

type QuantityStepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label: string;
};

/**
 * 수량 스테퍼(- 값 +).
 *
 * 시안 사양: 123 × 40, 검정 테두리 1.5px.
 * 하한(min) 이하로 내려가지 않도록 자체 clamp — 스토어에도 Math.max(1, ...) 방어가 있지만
 * 컴포넌트 단에서도 UX 를 위해 disabled 처리한다.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
}: QuantityStepperProps) {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  return (
    <div
      role="group"
      aria-label={label}
      className="mx-auto flex h-10 w-[123px] items-center"
    >
      <button
        type="button"
        aria-label="수량 감소"
        onClick={decrement}
        disabled={value <= min}
        className="flex h-10 w-[41px] items-center justify-center border-[1.5px] border-black text-[15px] transition-opacity hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <span
        aria-live="polite"
        className="flex h-10 w-[41px] items-center justify-center border-y-[1.5px] border-black text-[15px]"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="수량 증가"
        onClick={increment}
        disabled={value >= max}
        className="flex h-10 w-[41px] items-center justify-center border-[1.5px] border-black text-[15px] transition-opacity hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
