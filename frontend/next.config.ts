import path from "node:path";

import type { NextConfig } from "next";

/**
 * GitHub Pages 정적 배포 설정.
 *
 * 실 API 를 붙여 서버 렌더가 필요해지면(Vercel 등) 이 블록만 제거하면 된다.
 * - output: "export"  → next build 가 out/ 에 정적 HTML 을 생성한다
 * - basePath          → 프로젝트 페이지는 https://<user>.github.io/<repo>/ 로 서빙되어
 *                       모든 링크·자산 경로에 저장소 이름이 접두된다
 * - trailingSlash     → /notice → /notice/index.html 로 떨어뜨려 GitHub Pages 가
 *                       확장자 없는 경로를 그대로 찾을 수 있게 한다
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = "/eatomato-commerce";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  ...(isGithubPages && {
    basePath: repositoryName,
    assetPrefix: repositoryName,
  }),
  /**
   * Turbopack 은 프로젝트 루트를 자동 추론하는데,
   * 부모 디렉터리에 있는 package-lock.json 등 다른 워크스페이스를 감지하면 경고를 남긴다.
   * `turbopack.root` 를 이 프로젝트 루트로 명시해 오탐을 막는다.
   */
  turbopack: {
    root: path.join(__dirname),
  },
  /**
   * next/image 는 기본적으로 외부 도메인 이미지를 차단한다.
   * mock 단계에서 사용하는 Unsplash CDN 을 허용 목록에 명시한다.
   * 실 API 로 전환 시 자체 CDN 도메인으로 교체하면 된다.
   *
   * unoptimized: Image Optimization 은 런타임 서버가 필요해 정적 배포에서 쓸 수 없다.
   * Unsplash URL 에 이미 width/quality 파라미터를 실어 보내므로 화질 손실은 없다.
   */
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
