import type { Metadata } from "next";
import { Hahmlet } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

/**
 * 로고/세리프 카피에 사용할 Hahmlet.
 * `variable` 옵션으로 CSS 변수(`--font-hahmlet`)를 노출하고,
 * globals.css 의 `--font-serif` 가 이 변수를 참조하도록 연결한다.
 */
const hahmlet = Hahmlet({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-hahmlet",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://eatomato.example.com"),
  title: {
    default: "eatomato",
    template: "%s · eatomato",
  },
  description:
    "eatomato — 감각적인 핸드폰 케이스와 굿즈를 만나는 온라인 스토어",
  openGraph: {
    title: "eatomato",
    description:
      "eatomato — 감각적인 핸드폰 케이스와 굿즈를 만나는 온라인 스토어",
    type: "website",
    locale: "ko_KR",
  },
};

/**
 * 루트 레이아웃은 문서 셸(html/body)과 전역 리소스(폰트/스타일)만 담당한다.
 * TopBar 유무·헤더 종류는 페이지마다 다를 수 있으므로, 페이지가 `SiteFrame` 을
 * 조합해 그 결정을 내리게 두었다.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={hahmlet.variable}>
      <head>
        {/*
         * Pretendard Variable 웹폰트.
         * next/font 는 Google Fonts 만 지원하므로, CDN 서브셋을 preload 로 붙인다.
         * `<link>` 방식이 CSS `@import` 보다 렌더 블로킹이 적고 Tailwind 의 @import 순서 규칙과도 충돌하지 않는다.
         */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
