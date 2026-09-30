import type { ReactNode } from "react";

/**
 * 게시판 패널 셸 (시안 5p `.board`).
 *
 * 컨텐츠 폭이 다른 페이지(1200px `Container`)와 달리, 시안의 게시판은
 * 1280px 패널에 좌우 40px 안쪽 여백을 둬 안쪽 콘텐츠가 1200px 그리드에 맞는 구조다.
 * 그래서 `Container` 를 재사용하지 않고 별도 셸로 둔다.
 *
 * 하단 4분할 구분선은 디자인 피드백으로 뺐다. 선이 차지하던 아래 여백(34px)은 남겨 푸터까지 간격을 유지한다.
 */
export function BoardPanel({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-[1280px] bg-surface-primary px-5 pb-[34px] md:px-10">
      {children}
    </section>
  );
}
