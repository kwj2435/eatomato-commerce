import { Container } from "@/components/layout/Container";

/**
 * 상세 페이지 앵커 탭.
 *
 * 탭은 각 섹션의 id 로 스크롤 이동한다(브라우저 기본 앵커 동작).
 * 서버 컴포넌트로 두어 초기 마크업에 포함되고, JS 실행 이전에도 앵커가 동작한다.
 */

const TAB_ITEMS = [
  { href: "#details", label: "DETAILS" },
  { href: "#shipping", label: "DELIVERY" },
  { href: "#reviews", label: "REVIEWS" },
];

export function DetailTabs() {
  return (
    <Container as="section" aria-label="상품 상세 섹션 이동" className="mt-[117px]">
      <div className="h-px w-full bg-[#A9A6A6]" />
      <nav className="mt-4 flex flex-wrap items-center justify-center gap-5">
        {TAB_ITEMS.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            className="rounded-full bg-[#E8D9D7] px-3 py-1.5 text-[18px] font-normal tracking-[0.2px] text-brand-secondary transition-colors hover:bg-brand-highlight"
          >
            {tab.label}
          </a>
        ))}
      </nav>
    </Container>
  );
}
