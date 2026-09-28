"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * 관리자 화면 공통 UI.
 *
 * 스토어프론트(시안 기반)와 달리 관리자 화면은 정보 밀도가 우선이라,
 * 흰 카드 + 얇은 테두리 + 작은 글씨의 단순한 스타일로 통일한다. 색은 브랜드 딥 컬러 하나만 강조에 쓴다.
 */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.4px] text-ink-primary">{title}</h1>
        {description ? <p className="mt-1 text-[13px] text-ink-subtle">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-black/10 bg-white p-5", className)}>
      {title || actions ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h2 className="text-[15px] font-bold text-ink-primary">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
};

export function Button({ variant = "secondary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-8 px-3 text-[12px]" : "h-10 px-4 text-[14px]",
        variant === "primary" && "bg-brand-deep text-white hover:bg-brand-secondary",
        variant === "secondary" && "border border-black/15 bg-white text-ink-body hover:bg-black/[0.04]",
        variant === "danger" && "border border-brand-primary/40 bg-white text-brand-primary hover:bg-brand-primary hover:text-white",
        variant === "ghost" && "text-ink-muted hover:bg-black/[0.05]",
        className,
      )}
    />
  );
}

export const inputClass =
  "h-10 w-full rounded-md border border-black/15 bg-white px-3 text-[14px] text-ink-body outline-none focus:border-brand-deep disabled:bg-black/[0.03]";

export const textareaClass =
  "w-full rounded-md border border-black/15 bg-white px-3 py-2 text-[14px] leading-[1.6] text-ink-body outline-none focus:border-brand-deep";

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink-muted">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[12px] text-ink-subtle">{hint}</p> : null}
    </div>
  );
}

/** 상태 칩. 색만으로 구분하지 않도록 항상 글자 라벨을 함께 쓴다. */
export function Chip({ tone = "neutral", children }: { tone?: "neutral" | "brand" | "muted"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium",
        tone === "brand" && "bg-brand-highlight text-brand-secondary",
        tone === "neutral" && "bg-black/[0.06] text-ink-body",
        tone === "muted" && "bg-black/[0.03] text-ink-subtle",
      )}
    >
      {children}
    </span>
  );
}

export function Notice({ kind, children }: { kind: "error" | "success"; children: ReactNode }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md px-3 py-2 text-[13px]",
        kind === "error" ? "bg-brand-tint text-brand-primary" : "bg-[#EEF6EA] text-[#2F6B22]",
      )}
    >
      {children}
    </p>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-[13px]">
      <Button size="sm" disabled={page <= 0} onClick={() => onChange(page - 1)}>
        이전
      </Button>
      <span className="tabular-nums text-ink-muted">
        {page + 1} / {totalPages}
      </span>
      <Button size="sm" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        다음
      </Button>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-[13px] text-ink-subtle">{children}</p>;
}

/** 표 공통 스타일. */
export const tableClass = "w-full border-collapse text-left text-[13px]";
export const thClass = "border-b border-black/10 px-3 py-2 font-medium text-ink-subtle whitespace-nowrap";
export const tdClass = "border-b border-black/5 px-3 py-2.5 align-middle";
