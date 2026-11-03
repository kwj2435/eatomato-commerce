import Link from "next/link";
import type { ReactNode } from "react";

type HistorySectionProps = {
  /** 맨 위 요약 숫자에서 이 섹션으로 내려오는 앵커. */
  id: string;
  title: string;
  /** 제목 오른쪽 보조 문구·링크(예: "사용 가능 1장"). */
  aside?: ReactNode;
  /** 내역이 없을 때 보일 한 줄 안내. children 을 넘기면 쓰지 않는다. */
  emptyMessage?: string;
  /** 빈 상태에서 다음에 할 일(예: 쇼핑하러 가기). */
  emptyAction?: { href: string; label: string };
  /** 실제 내역. 넘기지 않으면 빈 상태를 그린다. */
  children?: ReactNode;
};

/**
 * 마이페이지 내역 블록(주문·쿠폰·적립금·후기). 제목 + 보조 문구 + 본문의 같은 골격을 쓴다.
 * 빈 상태는 예전 200px 빈 칸 대신 한 줄 안내(+ 다음 행동 링크)만 둔다.
 */
export function HistorySection({ id, title, aside, emptyMessage, emptyAction, children }: HistorySectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={`${id}-title`} className="text-[16px] font-bold tracking-[-0.2px] text-black md:text-[18px]">
          {title}
        </h2>
        {aside ? <span className="min-w-0 truncate text-[12px] text-ink-subtle md:text-[13px]">{aside}</span> : null}
      </div>

      <div className="mt-3">
        {children ?? (
          <div className="border border-dashed border-[#D9CDCA] px-4 py-5 text-center text-[13px] text-ink-subtle">
            <p>{emptyMessage}</p>
            {emptyAction ? (
              <Link
                href={emptyAction.href}
                className="mt-2 inline-block border-b border-black text-[12.5px] font-medium text-black hover:opacity-70"
              >
                {emptyAction.label}
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
