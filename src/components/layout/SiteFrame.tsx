import type { ReactNode } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { TopBar } from "@/components/layout/TopBar";

type SiteFrameProps = {
  children: ReactNode;
  /**
   * 상단 검정 공지 바 문구.
   * 지정하지 않으면 TopBar 를 렌더링하지 않는다(비-메인 페이지의 기본 동작).
   */
  notice?: string;
};

/**
 * 사이트 공통 셸.
 * `.page` (1440 캔버스) + TopBar(선택) + Header + main + Footer 로 구성된다.
 *
 * 페이지 레벨에서 조합하는 방식(RootLayout 이 아니라)을 택한 이유:
 * - TopBar 가 페이지마다 노출 여부/문구가 다를 수 있고, Header 위에 위치해야 하기 때문에
 *   RootLayout 한 곳에서 결정하기 어렵다.
 * - 명시적 컴포지션으로 각 페이지 코드에서 셸 구성이 즉시 보이도록 하기 위함이다.
 */
export function SiteFrame({ children, notice }: SiteFrameProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col bg-surface-primary">
      {notice ? <TopBar message={notice} /> : null}
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
