import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/** 검색로봇 수집 규칙. 관리자·회원·주문 화면은 검색 결과에 나올 필요가 없어 막는다. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/cart/", "/checkout/", "/mypage/", "/orders/", "/login/", "/signup/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
