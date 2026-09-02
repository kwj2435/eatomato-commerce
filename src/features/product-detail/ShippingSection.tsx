import { Container } from "@/components/layout/Container";

type ShippingSectionProps = {
  lines: string[];
};

/** SHIPPING (DELIVERY) 섹션 — 배송 안내 텍스트. */
export function ShippingSection({ lines }: ShippingSectionProps) {
  return (
    <Container as="section" id="shipping" className="scroll-mt-24 pt-[90px]">
      <h2 className="text-center text-[20px] font-normal tracking-[1.4px] text-brand-secondary">
        SHIPPING
      </h2>
      <div className="mt-[81px] flex flex-col">
        {lines.map((line, i) => (
          <p
            key={i}
            className="text-[11.5px] font-medium leading-[16.5px] tracking-[-0.2px] text-[#231815]"
          >
            {line}
          </p>
        ))}
      </div>
    </Container>
  );
}
