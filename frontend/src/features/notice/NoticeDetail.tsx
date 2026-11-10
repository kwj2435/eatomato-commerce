import Link from "next/link";

import { formatNoticeDay } from "@/lib/utils/format";
import type { Notice } from "@/types/notice";

import { BoardPanel } from "./BoardPanel";
import { parseNoticeTitle, toNoticeBlocks, type NoticeBlock } from "./notice-format";
import { NoticeTag } from "./NoticeTag";

type NoticeDetailProps = {
  notice: Notice;
  /** 목록에서 바로 위 글(없으면 null). */
  prev: Notice | null;
  /** 목록에서 바로 아래 글(없으면 null). */
  next: Notice | null;
};

/**
 * 공지사항 상세 뷰.
 *
 * - 본문은 읽기 좋은 폭(760px)으로 제한하고 화면 가운데에 둔다(위치 표시도 본문과 같은 폭으로 맞춘다).
 * - 관리자가 줄 앞에 쓴 기호로 꾸민다: ● 소제목 / · 목록 / ※ 안내 박스(`toNoticeBlocks`).
 * - 아래에 목록 순서 기준 이전·다음 글을 둔다.
 */
export function NoticeDetail({ notice, prev, next }: NoticeDetailProps) {
  const { category, title } = parseNoticeTitle(notice.title);

  return (
    <BoardPanel>
      <div className="mx-auto max-w-[760px]">
        <nav aria-label="위치" className="flex gap-2 pt-7 text-[13px] text-ink-subtle lg:pt-10">
          <Link href="/notice" className="font-medium text-ink-muted hover:text-ink-primary">
            공지사항
          </Link>
          {category ? (
            <>
              <span aria-hidden>›</span>
              <span>{category}</span>
            </>
          ) : null}
        </nav>

        <article>
          <header className="mt-3.5 border-b-[1.5px] border-ink-primary pb-[22px]">
            {notice.pinned || category ? (
              <div className="flex gap-1.5">
                {notice.pinned ? <NoticeTag kind="pinned" /> : null}
                {category ? <NoticeTag kind="category" label={category} /> : null}
              </div>
            ) : null}
            <h1 className="mt-3 break-keep text-[24px] font-bold leading-[1.35] tracking-[-0.6px] text-ink-primary lg:text-[28px]">
              {title}
            </h1>
            <time dateTime={notice.publishedAt} className="mt-2.5 block text-[13px] text-ink-subtle">
              {formatNoticeDay(notice.publishedAt)}
            </time>
          </header>

          <div className="py-8 text-[15.5px] leading-[1.8] tracking-[-0.2px] text-ink-body">
            {toNoticeBlocks(notice.body).map((block, i) => (
              <NoticeBlockView key={i} block={block} />
            ))}
          </div>

          {prev || next ? (
            <nav aria-label="이전·다음 글" className="border-t border-ink-primary">
              {prev ? <AdjacentLink label="이전 글" notice={prev} /> : null}
              {next ? <AdjacentLink label="다음 글" notice={next} /> : null}
            </nav>
          ) : null}

          <div className="mt-7 flex justify-center">
            <Link
              href="/notice"
              className="inline-flex h-12 items-center justify-center border border-ink-primary px-8 text-[14.5px] font-semibold text-ink-primary transition-colors hover:bg-ink-primary hover:text-ink-inverse"
            >
              목록으로
            </Link>
          </div>
        </article>
      </div>
    </BoardPanel>
  );
}

function NoticeBlockView({ block }: { block: NoticeBlock }) {
  switch (block.kind) {
    case "heading":
      return (
        <h2 className="mb-2.5 mt-6 flex items-center gap-2 text-[17px] font-bold text-ink-primary first:mt-0 before:h-4 before:w-1 before:flex-none before:bg-brand-primary">
          {block.text}
        </h2>
      );
    case "list":
      return (
        <ul className="mb-[18px] space-y-1.5">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="relative pl-3.5 before:absolute before:left-0.5 before:top-[0.8em] before:h-1 before:w-1 before:rounded-full before:bg-ink-muted"
            >
              {item}
            </li>
          ))}
        </ul>
      );
    case "note":
      return (
        <div className="mb-[18px] mt-2 space-y-1 border border-[#F0E2DE] bg-surface-elevated px-4 py-3.5 text-[14px] leading-[1.7] text-ink-muted">
          {block.items.map((item, i) => (
            <p key={i} className="flex gap-1.5">
              <span aria-hidden className="text-brand-deep">
                ※
              </span>
              <span>{item}</span>
            </p>
          ))}
        </div>
      );
    default:
      return <p className="mb-3.5">{block.text}</p>;
  }
}

function AdjacentLink({ label, notice }: { label: string; notice: Notice }) {
  return (
    <Link
      href={`/notice/${notice.id}`}
      className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#F0E2DE] px-1 py-[15px] text-[14px] transition-colors hover:bg-black/[0.02]"
    >
      <span className="text-[13px] text-ink-subtle">{label}</span>
      <span className="truncate text-ink-primary">{parseNoticeTitle(notice.title).title}</span>
      <time dateTime={notice.publishedAt} className="text-[12.5px] text-ink-subtle">
        {formatNoticeDay(notice.publishedAt)}
      </time>
    </Link>
  );
}
