import type { ReactNode } from "react";

type HistorySectionProps = {
  title: string;
  /** 내역이 없을 때 본문 중앙에 표시할 문구. */
  emptyMessage: string;
  /**
   * 제목과 본문 사이 우측 정렬 보조 영역.
   * 시안에서는 "주문 내역"에만 (후기 쓰러 가기 / 적립금 뱃지) 가 붙는다.
   */
  utility?: ReactNode;
  /**
   * 실제 내역 목록. 넘기지 않으면 empty state 를 렌더링한다.
   * 주문/쿠폰 API 가 붙으면 이 자리에 목록·테이블을 그대로 꽂으면 된다.
   */
  children?: ReactNode;
};

/**
 * 마이페이지 좌측 내역 블록.
 *
 * 시안 7p 의 다섯 블록(주문/내가 쓴 글/쿠폰/적립금/재입고 알림)이 제목 + 보조영역 + 본문의
 * 동일한 골격을 공유하므로 하나의 컴포넌트로 묶었다.
 *
 * 본문 상단 여백이 두 가지인 이유:
 * 보조영역이 있는 블록은 그 영역이 이미 간격을 만들어 15px, 없는 블록은 제목 바로 아래라 37px.
 * 시안의 `.history--first` 규칙을 순서(index)가 아니라 `utility` 유무에서 파생시켜
 * 블록 순서가 바뀌어도 간격이 어긋나지 않게 했다.
 */
export function HistorySection({
  title,
  emptyMessage,
  utility,
  children,
}: HistorySectionProps) {
  const isEmpty = !children;

  return (
    <section>
      <h2 className="text-[16px] font-bold leading-[22px] tracking-[-0.2px] text-black">
        {title}
      </h2>

      {utility ? (
        <div className="mt-[35px] flex items-center justify-end gap-1.5">
          {utility}
        </div>
      ) : null}

      <div className={utility ? "mt-[15px]" : "mt-[37px]"}>
        {isEmpty ? (
          <p className="flex h-[200px] items-center justify-center text-[13px] tracking-[-0.2px] text-black">
            {emptyMessage}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
