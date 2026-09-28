/**
 * 공지사항 게시글.
 *
 * 시안(publish/notice-page.html 5p)의 게시판 컬럼(번호 / 제목 / 글쓴이 / 등록일)을 그대로 모델링한다.
 */
export type Notice = {
  id: string;
  /**
   * 게시판 표시 번호.
   * 상단 고정 공지는 번호 대신 "공지" 라벨을 노출하므로 `null` 을 갖는다.
   */
  number: number | null;
  title: string;
  author: string;
  /** 등록 일시(ISO 8601). 표시 포맷은 `formatNoticeDate` 가 담당한다. */
  publishedAt: string;
  /** 상단 고정 여부. 고정 공지는 목록 최상단에 굵게 표시된다. */
  pinned: boolean;
  /** 상세 본문. 문단 단위 배열. */
  body: string[];
};
