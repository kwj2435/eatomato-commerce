import { Container } from "@/components/layout/Container";

type ShippingSectionProps = {
  lines: string[];
};

/** SHIPPING (DELIVERY) 섹션 — 배송 안내 텍스트. */
export function ShippingSection({ lines }: ShippingSectionProps) {
  return (
    <Container as="section" id="shipping" className="scroll-mt-24 pt-[90px]">
      <h2 className="text-center text-[17px] font-normal tracking-[1.2px] text-brand-secondary md:text-[20px] md:tracking-[1.4px]">
        SHIPPING
      </h2>
      {/* 어드민 문구의 "―――" 구분선은 줄바꿈이 안 돼 모바일에서 가로 스크롤을 만들므로 폭에 맞춰 자른다. */}
      <div className="mt-10 flex flex-col overflow-hidden md:mt-[81px]">
        {/* 빈 줄(엔터 두 번)은 내용 없는 <p> 라 높이가 0 이 되므로 한 줄 높이의 간격으로 그려 문단을 나눈다. */}
        {lines.map((line, i) =>
          line.trim() ? (
            <p
              key={i}
              className="text-[13px] font-medium leading-[21px] tracking-[-0.2px] text-[#231815] md:text-[15px] md:leading-[24px]"
            >
              {line}
            </p>
          ) : (
            <div key={i} aria-hidden className="h-[21px] md:h-[24px]" />
          ),
        )}
      </div>
    </Container>
  );
}
