import { listNotices } from "@/lib/api/notices";

import { BoardPanel } from "./BoardPanel";
import { NoticeSearch } from "./NoticeSearch";
import { NoticeTable } from "./NoticeTable";

type NoticeBoardProps = {
  /** URL 쿼리에서 넘어온 raw 검색어. 정규화 책임은 이 컴포넌트가 진다. */
  rawQuery: string | undefined;
};

/**
 * 공지사항 목록 뷰 (시안 5p).
 *
 * 서버 컴포넌트로 두어 목록이 초기 HTML 에 그대로 들어간다.
 * 검색 입력만 클라이언트(URL 갱신 트리거)로 분리했다 — 상품 리스트의 SortSelect 와 같은 구조다.
 *
 * 시안에 페이지네이션은 없고 19건이 한 화면에 모두 노출되므로 페이징은 두지 않았다.
 */
export async function NoticeBoard({ rawQuery }: NoticeBoardProps) {
  const query = rawQuery?.trim() ?? "";
  const notices = await listNotices({ query });

  return (
    <BoardPanel>
      <NoticeTable notices={notices} />
      {/* key: URL 검색어가 바뀌면 입력 상태를 새 값으로 다시 마운트한다(뒤로가기 대응). */}
      <NoticeSearch key={query} currentQuery={query} />
    </BoardPanel>
  );
}
