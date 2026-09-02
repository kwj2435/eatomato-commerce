import path from "node:path";

import type { NextConfig } from "next";

/**
 * Turbopack 은 프로젝트 루트를 자동 추론하는데,
 * 부모 디렉터리에 있는 package-lock.json 등 다른 워크스페이스를 감지하면 경고를 남긴다.
 * `turbopack.root` 를 이 프로젝트 루트로 명시해 오탐을 막는다.
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  /**
   * next/image 는 기본적으로 외부 도메인 이미지를 차단한다.
   * mock 단계에서 사용하는 Unsplash CDN 을 허용 목록에 명시한다.
   * 실 API 로 전환 시 자체 CDN 도메인으로 교체하면 된다.
   */
  images: {
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
