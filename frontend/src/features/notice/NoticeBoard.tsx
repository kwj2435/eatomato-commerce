import { Suspense } from "react";

import { listNotices } from "@/lib/api/notices";

import { BoardPanel } from "./BoardPanel";
import { NoticeBoardResults } from "./NoticeBoardResults";
import { NoticeCategoryChips, NoticeSearchStatic, countNoticeCategories } from "./NoticeFilters";
import { NoticeList } from "./NoticeList";

/**
 * 공지사항 목록 뷰.
 *
 * 서버 컴포넌트로 두어 목록이 초기 HTML 에 그대로 들어간다.
 * 분류·검색은 URL 쿼리에 의존하므로 정적 생성이 가능하도록 클라이언트로 넘긴다.
 * 글 수가 적어 페이징은 두지 않았다.
 *
 * Suspense: `useSearchParams()` 를 쓰는 결과 영역만 경계 안에 둬서
 * 페이지 전체가 정적 생성에서 빠지지 않게 한다.
 * fallback 은 그대로 정적 HTML 이 되므로 스켈레톤이 아니라 "필터 전 전체 목록" 을 렌더링한다.
 */
export async function NoticeBoard() {
  const notices = await listNotices();

  return (
    <BoardPanel>
      <header className="pt-7 lg:pt-10">
        <h1 className="text-[22px] font-bold tracking-[-0.5px] text-ink-primary lg:text-[26px]">공지사항</h1>
        <p className="mt-1.5 text-[14px] tracking-[-0.2px] text-ink-muted">배송·교환 안내와 이벤트 소식을 알려드려요.</p>
      </header>
      <Suspense
        fallback={
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <NoticeCategoryChips
                total={notices.length}
                categories={countNoticeCategories(notices)}
                active={null}
                query=""
              />
              <NoticeSearchStatic />
            </div>
            <div className="mt-4">
              <NoticeList notices={notices} />
            </div>
            <p className="mt-3.5 text-[12.5px] text-ink-subtle">총 {notices.length}개의 글</p>
          </>
        }
      >
        <NoticeBoardResults notices={notices} />
      </Suspense>
    </BoardPanel>
  );
}
