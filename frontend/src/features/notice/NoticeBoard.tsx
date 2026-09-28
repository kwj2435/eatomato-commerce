import { Suspense } from "react";

import { listNotices } from "@/lib/api/notices";

import { BoardPanel } from "./BoardPanel";
import { NoticeBoardResults } from "./NoticeBoardResults";
import { NoticeSearch } from "./NoticeSearch";
import { NoticeTable } from "./NoticeTable";

/**
 * 공지사항 목록 뷰 (시안 5p).
 *
 * 서버 컴포넌트로 두어 목록이 초기 HTML 에 그대로 들어간다.
 * 검색은 URL 쿼리에 의존하므로 정적 생성이 가능하도록 클라이언트로 넘긴다.
 *
 * 시안에 페이지네이션은 없고 19건이 한 화면에 모두 노출되므로 페이징은 두지 않았다.
 *
 * Suspense: `useSearchParams()` 를 쓰는 결과 영역만 경계 안에 둬서
 * 페이지 전체가 정적 생성에서 빠지지 않게 한다.
 * fallback 은 그대로 정적 HTML 이 되므로 스켈레톤이 아니라 "검색 전 전체 목록" 을 렌더링한다.
 */
export async function NoticeBoard() {
  const notices = await listNotices();

  return (
    <BoardPanel>
      <Suspense
        fallback={
          <>
            <NoticeTable notices={notices} />
            <NoticeSearch currentQuery="" />
          </>
        }
      >
        <NoticeBoardResults notices={notices} />
      </Suspense>
    </BoardPanel>
  );
}
