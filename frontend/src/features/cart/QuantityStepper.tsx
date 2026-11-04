"use client";

type QuantityStepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label: string;
  /**
   * - `md`: 상품 상세 구매 패널용. 123 × 40, 검정 테두리 1.5px.
   * - `sm`: 장바구니용. 34px 높이, 웜그레이 1px 테두리로 가볍게.
   */
  size?: "md" | "sm";
};

const STYLES = {
  md: {
    group: "mx-auto flex h-10 w-[123px] items-center",
    button:
      "flex h-10 w-[41px] items-center justify-center border-[1.5px] border-black text-[15px] transition-opacity hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40",
    value: "flex h-10 w-[41px] items-center justify-center border-y-[1.5px] border-black text-[15px]",
  },
  sm: {
    group: "flex h-[34px] items-stretch border border-[#D9CFCC] bg-surface-elevated",
    button:
      "flex w-[34px] items-center justify-center text-[16px] text-ink-primary transition-colors hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:text-[#C9C0BD] disabled:hover:bg-transparent",
    value: "flex w-[38px] items-center justify-center border-x border-[#ECE3E0] text-[14px]",
  },
} as const;

/**
 * 수량 스테퍼(- 값 +).
 *
 * 하한(min) 이하로 내려가지 않도록 자체 clamp — 스토어에도 Math.max(1, ...) 방어가 있지만
 * 컴포넌트 단에서도 UX 를 위해 disabled 처리한다.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
  size = "md",
}: QuantityStepperProps) {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));
  const style = STYLES[size];

  return (
    <div role="group" aria-label={label} className={style.group}>
      <button
        type="button"
        aria-label="수량 감소"
        onClick={decrement}
        disabled={value <= min}
        className={style.button}
      >
        −
      </button>
      <span aria-live="polite" className={style.value}>
        {value}
      </span>
      <button
        type="button"
        aria-label="수량 증가"
        onClick={increment}
        disabled={value >= max}
        className={style.button}
      >
        +
      </button>
    </div>
  );
}
