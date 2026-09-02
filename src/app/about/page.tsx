import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { AboutContent } from "@/features/about/AboutContent";

export const metadata: Metadata = {
  title: "About",
  description: "eatomato 브랜드 소개 — 감각적인 데일리 굿즈 이야기",
};

export default function AboutPage() {
  return (
    <SiteFrame>
      <AboutContent />
    </SiteFrame>
  );
}
