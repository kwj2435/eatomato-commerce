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
 * TopBar(선택) + Header + main + Footer 로 구성된다.
 *
 * 폭 상한을 두지 않는 이유:
 * 시안의 1440px 은 Figma 작업 캔버스 크기이지 최대 폭이 아니다
 * (시안 주석: "컨테이너 1200px — 1440 프레임 기준 좌우 여백 120px").
 * 상한을 두면 넓은 화면에서 배경(#FFF5F5)이 1440px 기둥으로 서고 바깥은 body 배경(#F2EEEC)이
 * 드러나 박스형 레이아웃이 된다. 배경은 화면 끝까지 채우고, 콘텐츠 정렬은
 * 각 섹션의 `Container`(1200px)가 담당한다.
 *
 * 페이지 레벨에서 조합하는 방식(RootLayout 이 아니라)을 택한 이유:
 * - TopBar 가 페이지마다 노출 여부/문구가 다를 수 있고, Header 위에 위치해야 하기 때문에
 *   RootLayout 한 곳에서 결정하기 어렵다.
 * - 명시적 컴포지션으로 각 페이지 코드에서 셸 구성이 즉시 보이도록 하기 위함이다.
 */
export function SiteFrame({ children, notice }: SiteFrameProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-surface-primary">
      {notice ? <TopBar message={notice} /> : null}
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
