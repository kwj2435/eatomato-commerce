import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { InstagramIcon } from "@/components/ui/icons";

/**
 * 정책/약관 링크 및 회사 정보. 데이터는 배열로 두어 마크업이 짧고 확장이 쉽다.
 */
const POLICY_LINKS = [
  { label: "Terms of Use", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  {
    label: "Confirm Entrepreneur Information",
    href: "https://www.ftc.go.kr/bizCommPop.do",
  },
];

const COMPANY_INFO = [
  "Company Name : eatomato ｜ Owner : YerimKim ｜ Email : eatomato.design@gmail.com ｜",
  "Address : 28, Songdomunhwa-ro 28beon-gil, Yeonsu-gu, Incheon",
];

/**
 * 사이트 공통 푸터.
 * - 상단 헤어라인 구분선 + 정책 링크 + 사업자 정보로 구성된다.
 * - 인스타 링크는 컨테이너 우측 상단에 절대 위치로 붙는다(시안 규격).
 * - 모바일에서는 절대 위치가 겹치지 않도록 flex-column 배치로 흐른다.
 */
export function Footer() {
  return (
    <footer className="mt-[100px] pb-[100px]">
      <Container>
        <div className="h-px w-full bg-brand-divider" />

        <div className="relative flex flex-col items-center gap-[5px] pt-[76px]">
          <ul className="flex flex-wrap items-center justify-center gap-4">
            {POLICY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[12.5px] font-bold leading-[15px] tracking-[-0.2px] text-black transition-opacity hover:opacity-70"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <address className="flex flex-col items-center not-italic">
            {COMPANY_INFO.map((line) => (
              <p
                key={line}
                className="text-center text-[12.5px] font-normal leading-[15px] tracking-[-0.2px] text-black"
              >
                {line}
              </p>
            ))}
          </address>

          <a
            href="https://www.instagram.com/eatomato__/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center gap-1.5 text-accent-sns transition-opacity hover:opacity-70 lg:absolute lg:right-0 lg:top-[76px] lg:mt-0"
          >
            <InstagramIcon />
            <span className="text-[13px] tracking-[-0.2px]">eatomato__</span>
          </a>
        </div>
      </Container>
    </footer>
  );
}
