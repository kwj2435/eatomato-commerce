import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { AboutContent } from "@/features/about/AboutContent";
import { getSiteContents } from "@/lib/api/site-content";

export const metadata: Metadata = {
  title: "About",
  description: "eatomato 브랜드 소개 — 감각적인 데일리 굿즈 이야기",
};

/** 글·이미지는 관리자 화면(문구)에서 고친다. 서버가 60초마다 다시 받아 반영한다. */
export default async function AboutPage() {
  const contents = await getSiteContents();
  return (
    <SiteFrame>
      <AboutContent
        topText={contents.ABOUT_TOP_TEXT}
        imageUrl={contents.ABOUT_IMAGE_URL}
        bottomText={contents.ABOUT_BOTTOM_TEXT}
      />
    </SiteFrame>
  );
}
