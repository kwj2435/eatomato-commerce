import { MOCK_NOTICES } from "@/lib/mock/notices";
import type { Notice } from "@/types/notice";

/**
 * 공지사항 API.
 *
 * 상품 API 와 동일하게, 지금은 mock 을 다루지만 시그니처는 실제 서버 호출과 같게 유지한다.
 * 실서버 연동 시 이 파일 내부만 fetch(...) 로 교체하면 UI 는 무변경이다.
 */

export type ListNoticesParams = {
  /** 제목 검색어. 공백만 있거나 비어 있으면 전체를 반환한다. */
  query?: string;
};

/**
 * 공지사항 목록.
 *
 * 정렬 규칙: 고정 공지가 항상 먼저, 그 안에서는 등록일 내림차순.
 * 검색은 제목만 대상으로 하며(시안의 검색 영역이 게시판 제목 검색), 고정 공지도 함께 걸러진다.
 */
export async function listNotices(
  params: ListNoticesParams = {},
): Promise<Notice[]> {
  const keyword = params.query?.trim().toLowerCase() ?? "";

  const filtered = keyword
    ? MOCK_NOTICES.filter((n) => n.title.toLowerCase().includes(keyword))
    : MOCK_NOTICES;

  return [...filtered].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.publishedAt.localeCompare(a.publishedAt);
  });
}

/** 단건 조회. 없으면 `null` 을 반환해 호출부가 404 로 처리하게 한다. */
export async function getNotice(id: string): Promise<Notice | null> {
  return MOCK_NOTICES.find((n) => n.id === id) ?? null;
}

/** 정적 생성용 id 목록. */
export async function listNoticeIds(): Promise<string[]> {
  return MOCK_NOTICES.map((n) => n.id);
}
