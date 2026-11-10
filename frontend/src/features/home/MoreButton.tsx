import Link from "next/link";

/**
 * 메인 섹션 상품 목록 바로 아래의 "○○ 전체 보기 →" 버튼.
 * 상품을 끝까지 본 사람이 목록으로 넘어갈 곳을 준다(제목 옆 "전체 보기"만으로는 잘 안 눌렸다).
 * 모바일은 화면 폭 가득, PC 는 가운데 360px. 공지 '목록으로'와 같은 각진 검은 테두리 버튼이다.
 */
export function MoreButton({ href, label }: { href: string; label: string }) {
  return (
    <div className="mt-7 flex justify-center md:mt-10">
      <Link
        href={href}
        className="flex h-[52px] w-full items-center justify-center gap-2 border border-ink-primary text-[15px] font-semibold tracking-[-0.3px] text-ink-primary transition-colors hover:bg-ink-primary hover:text-ink-inverse md:h-14 md:w-[360px]"
      >
        {label} <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
