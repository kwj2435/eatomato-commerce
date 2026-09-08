import type { Metadata } from "next";

import { SiteFrame } from "@/components/layout/SiteFrame";
import { SearchView } from "@/features/search/SearchView";

export const metadata: Metadata = {
  title: "검색",
  description: "eatomato 상품을 검색해 보세요.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  return (
    <SiteFrame>
      <SearchView
        rawQuery={typeof sp.q === "string" ? sp.q : undefined}
        rawSort={typeof sp.sort === "string" ? sp.sort : undefined}
      />
    </SiteFrame>
  );
}
