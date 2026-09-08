import type { ReactNode } from "react";

/**
 * 게시판 패널 셸 (시안 5p `.board`).
 *
 * 컨텐츠 폭이 다른 페이지(1200px `Container`)와 달리, 시안의 게시판은
 * 1280px 패널에 좌우 40px 안쪽 여백을 둬 안쪽 콘텐츠가 1200px 그리드에 맞는 구조다.
 * 그래서 `Container` 를 재사용하지 않고 별도 셸로 둔다.
 *
 * 하단 4분할 구분선은 시안 5p 캡처에 그대로 노출된 요소라 패널의 일부로 포함한다.
 */
export function BoardPanel({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-[1280px] bg-surface-util px-5 pb-px md:px-10">
      {children}

      <div className="mt-[33px] grid grid-cols-4 gap-8">
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className="h-px bg-[#ADADAD]" />
        ))}
      </div>
    </section>
  );
}
