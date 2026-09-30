import path from "node:path";

import type { NextConfig } from "next";

/**
 * 배포 대상이 둘이라 빌드 모드도 둘이다.
 *
 * - 운영(eatomato.kr, VM Docker): output "standalone" — Node 서버로 돌며,
 *   상품·배너·공지는 60초마다 백엔드에서 다시 받아 페이지를 갱신한다(ISR, lib/api/client.ts).
 *   관리자 화면에서 새로 등록한 상품 페이지도 첫 요청 때 바로 만들어진다.
 * - GitHub Pages(GITHUB_PAGES=true): output "export" — 빌드 시점 데이터로 굳힌 정적 사본.
 *   - basePath      → 프로젝트 페이지는 https://<user>.github.io/<repo>/ 로 서빙되어
 *                     모든 링크·자산 경로에 저장소 이름이 접두된다
 *
 * trailingSlash: /notice → /notice/ 로 맞춘다. GitHub Pages 가 확장자 없는 경로를
 * /notice/index.html 로 찾게 하려던 설정인데, 운영 서버 모드에서도 URL 을 같게 두려고 유지한다.
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = "/eatomato-commerce";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : "standalone",
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
   * 옛 주소 → 새 주소. 에어팟 케이스는 Phone ACC 아래에서 Earphone Case > AirPods 로 옮겼다.
   * 정적 export(GitHub Pages)는 redirects 를 지원하지 않아 운영 서버 모드에서만 둔다.
   */
  ...(!isGithubPages && {
    async redirects() {
      return [
        { source: "/products/phone-acc/airpods-case/", destination: "/products/earphone-case/airpods/", permanent: true },
      ];
    },
  }),
  /**
   * next/image 는 기본적으로 외부 도메인 이미지를 차단한다.
   * - images.unsplash.com: 데모 상품·배너 이미지
   * - eatomato.kr: 후기 사진 등 백엔드 업로드 파일(/uploads/**)
   *
   * 크기 조절은 커스텀 로더(src/lib/image-loader.ts)가 이미지 서버 파라미터로 한다.
   * VM 메모리가 작아 Next 서버의 이미지 최적화(sharp)는 쓰지 않는다. 정적 export 에서도 동작한다.
   */
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "eatomato.kr",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
