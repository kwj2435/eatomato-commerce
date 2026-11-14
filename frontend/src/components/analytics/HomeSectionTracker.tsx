"use client";

import { useEffect } from "react";

import { type HomeSection, trackInteraction } from "@/lib/analytics";

/** 섹션이 이만큼 보이면 "봤다"로 친다: 섹션 높이의 30% 또는 화면 높이의 절반 중 작은 쪽. */
const SEEN_SECTION_RATIO = 0.3;
const SEEN_VIEWPORT_RATIO = 0.5;

const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

/**
 * 메인 섹션 노출·클릭 기록(관리자 > 방문자 분석 > 메인 섹션).
 *
 * - 노출: data-track-section 을 단 섹션이 충분히 화면에 들어오면 페이지당 섹션마다 한 번 보낸다.
 *   맨 아래 섹션까지 몇 % 가 내려왔는지(스크롤 깊이)를 섹션 단위로 본다.
 * - 클릭: 섹션 안의 링크를 누르면 섹션 이름, 섹션 안 몇 번째 링크인지, 누른 주소를 보낸다.
 * 섹션 컴포넌트는 서버 컴포넌트라 고치지 않고, 메인 페이지가 섹션을 감싼 div 의 속성만 읽는다.
 */
export function HomeSectionTracker() {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-track-section]"));
    const seen = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const name = el.dataset.trackSection as HomeSection | undefined;
          if (!name || seen.has(name) || !entry.isIntersecting) continue;
          const need = Math.min(
            entry.boundingClientRect.height * SEEN_SECTION_RATIO,
            window.innerHeight * SEEN_VIEWPORT_RATIO,
          );
          if (entry.intersectionRect.height < need) continue;
          seen.add(name);
          observer.unobserve(el);
          trackInteraction({ type: "SECTION_VIEW", section: name });
        }
      },
      { threshold: THRESHOLDS },
    );
    sections.forEach((el) => observer.observe(el));

    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      const section = link?.closest<HTMLElement>("[data-track-section]");
      const name = section?.dataset.trackSection as HomeSection | undefined;
      if (!link || !section || !name) return;
      const index = Array.from(section.querySelectorAll("a[href]")).indexOf(link);
      trackInteraction({ type: "SECTION_CLICK", section: name, index: Math.max(index, 0), href: link.getAttribute("href") ?? "" });
    };
    // 링크가 화면을 바꾸기 전에 잡도록 캡처 단계에서 듣는다. 전송은 keepalive 라 이동 중에도 끝난다.
    document.addEventListener("click", onClick, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
