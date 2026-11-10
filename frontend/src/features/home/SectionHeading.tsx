import Link from "next/link";

import { MultilineText } from "@/components/ui/MultilineText";

type SectionHeadingProps = {
  /** h2 의 id. 섹션의 aria-labelledby 가 가리킨다. */
  id: string;
  title: string;
  /** 섹션 설명. 관리자 화면(문구)에서 고친다. 비어 있으면 설명 줄을 그리지 않는다. */
  description?: string;
  /** 있으면 제목 줄 오른쪽에 "전체 보기 →" 버튼을 둔다(목록 아래 MoreButton 과 같은 테두리 버튼). */
  moreHref?: string;
};

/**
 * 메인 섹션 제목(제안서 03). 제목을 조금 크고 굵게, 설명과의 간격은 좁게 둔다.
 * 모든 메인 섹션이 같이 써서 제목 크기·간격이 섹션마다 엇갈리지 않게 한다.
 */
export function SectionHeading({ id, title, description, moreHref }: SectionHeadingProps) {
  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <h2 id={id} className="text-[24px] font-semibold tracking-[-0.4px] text-black md:text-[30px]">
          {title}
        </h2>
        {moreHref ? (
          <Link
            href={moreHref}
            className="mb-0.5 inline-flex h-9 flex-none items-center gap-1.5 border border-ink-primary px-3.5 text-[13px] font-semibold tracking-[-0.2px] text-ink-primary transition-colors hover:bg-ink-primary hover:text-ink-inverse md:h-10 md:px-[18px] md:text-[14px]"
          >
            전체 보기 <span aria-hidden>→</span>
            <span className="sr-only"> ({title})</span>
          </Link>
        ) : null}
      </div>
      {description ? (
        <p className="mt-2 text-[14px] font-normal leading-[22px] tracking-[-0.3px] text-ink-muted md:mt-3 md:text-[17.5px] md:leading-[25.1px]">
          <MultilineText text={description} />
        </p>
      ) : null}
    </>
  );
}
