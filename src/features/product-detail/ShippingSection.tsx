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
      <div className="mt-10 flex flex-col md:mt-[81px]">
        {lines.map((line, i) => (
          <p
            key={i}
            className="text-[13px] font-medium leading-[21px] tracking-[-0.2px] text-[#231815] md:text-[15px] md:leading-[24px]"
          >
            {line}
          </p>
        ))}
      </div>
    </Container>
  );
}
