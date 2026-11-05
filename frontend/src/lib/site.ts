/**
 * 사이트 공통 정보(검색엔진·공유 미리보기용).
 *
 * 메타데이터·robots.txt·sitemap.xml·JSON-LD 가 모두 이 값을 쓴다.
 * 검색 결과에 한글 브랜드명으로도 잡히도록 "잇토마토" 를 함께 둔다.
 */
export const SITE_URL = "https://eatomato.kr";
export const SITE_NAME = "eatomato";
export const SITE_NAME_KO = "잇토마토";
export const SITE_TITLE = "eatomato 잇토마토 | 핸드폰 케이스 · 라이프스타일 굿즈";
export const SITE_DESCRIPTION =
  "잇토마토(eatomato) 공식 온라인 스토어. 토마토를 닮은 감각적인 핸드폰 케이스와 그립톡, 키링 등 라이프스타일 굿즈를 만나보세요.";
/** 링크 공유 시 기본 대표 사진(1200×630, public/). */
export const DEFAULT_OG_IMAGE = { url: "/og-default.jpg", width: 1200, height: 630, alt: "eatomato 잇토마토" };

/**
 * 공유 미리보기 기본값. 페이지에서 openGraph 를 지정하면 레이아웃 값을 통째로 덮어쓰므로(얕은 병합)
 * 페이지는 항상 이 값을 펼친 뒤 바꿀 것만 덮어쓴다.
 */
export const BASE_OPEN_GRAPH = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  siteName: `${SITE_NAME} ${SITE_NAME_KO}`,
  type: "website" as const,
  locale: "ko_KR",
  images: [DEFAULT_OG_IMAGE],
};

export const INSTAGRAM_URL = "https://www.instagram.com/eatomato__/";
export const NAVER_BLOG_URL = "https://blog.naver.com/eatomato_";

/**
 * 네이버 서치어드바이저 소유확인 값(HTML 태그 방식의 content 값).
 * 서치어드바이저에서 받은 값을 넣고 배포하면 `<meta name="naver-site-verification">` 이 붙는다. 비어 있으면 태그를 넣지 않는다.
 */
export const NAVER_SITE_VERIFICATION = "";

/** JSON-LD `<script>` 본문. `<` 를 이스케이프해 문자열 안의 태그가 HTML 로 해석되지 않게 한다. */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
