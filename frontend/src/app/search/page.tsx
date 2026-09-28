import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { SearchView } from "@/features/search/SearchView";

export const metadata: Metadata = {
  title: "검색",
  description: "eatomato 상품을 검색해 보세요.",
};

export default function SearchPage() {
  return (
    <SiteFrame>
      <SearchView />
    </SiteFrame>
  );
}
