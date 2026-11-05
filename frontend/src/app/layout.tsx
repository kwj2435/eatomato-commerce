import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense, type ReactNode } from "react";

import { PageViewTracker } from "@/components/analytics/PageViewTracker";

import {
  BASE_OPEN_GRAPH,
  DEFAULT_OG_IMAGE,
  NAVER_SITE_VERIFICATION,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";

import "./globals.css";

/**
 * 로고/세리프 카피에 사용할 Hahmlet (디자이너 전달 폰트 파일).
 *
 * 원본 ttf 는 한글 포함 1.5MB 라, 로고에 쓰는 라틴(U+0020–007E)만 남겨
 * woff2 로 서브셋했다(약 16KB). 한글 세리프가 필요해지면 서브셋 범위를 넓혀 다시 생성한다.
 * `variable` 옵션으로 CSS 변수(`--font-hahmlet`)를 노출하고,
 * globals.css 의 `--font-serif` 가 이 변수를 참조하도록 연결한다.
 */
const hahmlet = localFont({
  src: "./fonts/Hahmlet-SemiBold-latin.woff2",
  weight: "600",
  variable: "--font-hahmlet",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · eatomato",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["eatomato", "잇토마토", "핸드폰 케이스", "폰케이스", "맥세이프 케이스", "카드 케이스", "그립톡", "토마토"],
  openGraph: BASE_OPEN_GRAPH,
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
  ...(NAVER_SITE_VERIFICATION
    ? { verification: { other: { "naver-site-verification": NAVER_SITE_VERIFICATION } } }
    : {}),
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
         * Pretendard Variable 웹폰트(dynamic subset: 페이지에 쓰인 글자 범위만 내려받는다).
         * 전체 파일(2MB)을 받던 것을 바꿔 모바일 첫 화면이 크게 빨라졌다.
         * next/font 는 Google Fonts 만 지원하므로, CDN 서브셋을 preload 로 붙인다.
         * `<link>` 방식이 CSS `@import` 보다 렌더 블로킹이 적고 Tailwind 의 @import 순서 규칙과도 충돌하지 않는다.
         */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen">
        {children}
        {/* 방문자 분석용 조회 기록. 화면에는 아무것도 그리지 않는다. */}
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
      </body>
    </html>
  );
}
