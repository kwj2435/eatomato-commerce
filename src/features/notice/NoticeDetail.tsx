import Link from "next/link";

import { formatNoticeDate } from "@/lib/utils/format";
import type { Notice } from "@/types/notice";

import { BoardPanel } from "./BoardPanel";

/**
 * 공지사항 상세 뷰.
 *
 * 시안(request_layout.pdf)에는 상세 화면이 없다.
 * 목록에서 제목을 눌렀을 때 404 로 떨어지지 않도록, 5p 게시판의 타이포·구분선 규격
 * (제목 15px / 메타 14px / 1px 검정 구분선 / #FFFDF8 패널)만 그대로 이어받아 최소 구성으로 만들었다.
 * 실제 상세 시안이 나오면 이 컴포넌트만 교체하면 된다.
 */
export function NoticeDetail({ notice }: { notice: Notice }) {
  return (
    <BoardPanel>
      <article>
        <header className="border-b border-black py-6">
          <h1 className="text-[18px] font-bold leading-[26px] tracking-[-0.2px] text-black">
            {notice.title}
          </h1>
          <p className="mt-2.5 text-[14px] tracking-[-0.2px] text-ink-subtle">
            {notice.author} · {formatNoticeDate(notice.publishedAt)}
          </p>
        </header>

        <div className="flex flex-col gap-4 border-b border-black py-10">
          {notice.body.map((paragraph, index) => (
            <p
              key={index}
              className="text-[15px] leading-[26px] tracking-[-0.2px] text-black"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      <div className="mt-5 flex justify-end">
        <Link
          href="/notice"
          className="flex h-11 w-[68px] items-center justify-center border border-black text-[14px] tracking-[-0.2px] text-black transition-colors hover:bg-black hover:text-white"
        >
          목록
        </Link>
      </div>
    </BoardPanel>
  );
}
