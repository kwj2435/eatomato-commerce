import Link from "next/link";

import { cn } from "@/lib/utils/cn";
import { formatNoticeDate } from "@/lib/utils/format";
import type { Notice } from "@/types/notice";

type NoticeTableProps = {
  notices: Notice[];
};

/**
 * 공지사항 목록 테이블 (시안 5p).
 *
 * 컬럼 폭은 시안 실측(번호 100 / 제목 auto / 글쓴이 100 / 등록일 144)을 `colgroup` 으로 고정한다.
 * `table-layout: fixed` 와 함께 써야 긴 제목이 들어와도 다른 컬럼이 밀리지 않는다.
 *
 * 좁은 화면에서는 4열 게시판을 억지로 접기보다 가로 스크롤을 허용한다
 * (컬럼을 숨기면 등록일·글쓴이를 확인할 수 없어 게시판의 기능이 깨진다).
 */
export function NoticeTable({ notices }: NoticeTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] table-fixed border-collapse">
        <colgroup>
          <col className="w-[100px]" />
          <col />
          <col className="w-[100px]" />
          <col className="w-[144px]" />
        </colgroup>

        <thead>
          <tr>
            {["번호", "제목", "글쓴이", "등록일"].map((label) => (
              <th
                key={label}
                scope="col"
                className="h-[55px] border-b border-black text-center text-[14px] font-normal tracking-[-0.2px] text-black"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {notices.map((notice) => (
            <tr key={notice.id}>
              <td className={cn(cellClass, notice.pinned && "font-bold")}>
                {notice.pinned ? "공지" : notice.number}
              </td>
              <td
                className={cn(
                  cellClass,
                  "pl-2.5 text-left",
                  notice.pinned && "font-bold",
                )}
              >
                <Link
                  href={`/notice/${notice.id}`}
                  className="underline-offset-2 transition-colors hover:text-brand-primary hover:underline"
                >
                  {notice.title}
                </Link>
              </td>
              <td className={cn(cellClass, notice.pinned && "font-bold")}>
                {notice.author}
              </td>
              <td className={cn(cellClass, notice.pinned && "font-bold")}>
                {formatNoticeDate(notice.publishedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {notices.length === 0 ? (
        <p className="flex h-[200px] items-center justify-center text-[15px] tracking-[-0.2px] text-ink-muted">
          검색 결과가 없습니다.
        </p>
      ) : null}
    </div>
  );
}

/** 시안 `.notice-table td` 규격. 모든 셀이 공유한다. */
const cellClass =
  "h-[60px] border-b border-black text-center text-[15px] font-normal tracking-[-0.2px] text-black";
