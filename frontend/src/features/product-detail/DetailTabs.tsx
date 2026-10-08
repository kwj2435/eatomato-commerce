import { Container } from "@/components/layout/Container";

/**
 * 상세 페이지 앵커 탭.
 *
 * 탭은 각 섹션의 id 로 스크롤 이동한다(브라우저 기본 앵커 동작).
 * 서버 컴포넌트로 두어 초기 마크업에 포함되고, JS 실행 이전에도 앵커가 동작한다.
 * 탭 줄은 스크롤해도 화면 위에 붙어 있다(sticky). 구분선은 붙지 않고 제자리에 남는다.
 */

const TAB_ITEMS = [
  { href: "#details", label: "DETAILS" },
  { href: "#shipping", label: "DELIVERY" },
  { href: "#reviews", label: "REVIEWS" },
];

export function DetailTabs() {
  return (
    <>
      <Container aria-hidden className="mt-[80px] md:mt-[117px]">
        <div className="h-px w-full bg-[#A9A6A6]" />
      </Container>
      <nav
        aria-label="상품 상세 섹션 이동"
        className="sticky top-0 z-30 flex flex-wrap items-center justify-center gap-[18px] bg-surface-primary py-3"
      >
        {TAB_ITEMS.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            className="w-[86px] rounded-full bg-white py-1 text-center text-[15px] leading-5 font-normal tracking-[0.2px] text-brand-secondary transition-colors hover:bg-brand-highlight"
          >
            {tab.label}
          </a>
        ))}
      </nav>
    </>
  );
}
