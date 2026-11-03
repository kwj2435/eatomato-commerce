"use client";

import { useEffect, useState } from "react";

import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils/cn";

/**
 * 상세 페이지 앵커 탭.
 *
 * 탭은 각 섹션의 id 로 스크롤 이동한다(브라우저 기본 앵커 동작이라 JS 실행 전에도 동작한다).
 * 탭 줄은 스크롤해도 화면 위에 붙어 있고(sticky), 지금 보고 있는 섹션의 탭을 진한 색으로 채운다.
 * 구분선은 붙지 않고 제자리에 남는다.
 */

const TAB_ITEMS = [
  { id: "details", label: "DETAILS" },
  { id: "shipping", label: "DELIVERY" },
  { id: "reviews", label: "REVIEWS" },
];

/** 섹션 머리가 화면 위에서 이 높이(탭 줄 아래)를 지나면 그 섹션을 보는 중으로 친다. */
const ACTIVE_OFFSET = 120;

export function DetailTabs() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = null;
      for (const { id } of TAB_ITEMS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = id;
      }
      // 페이지 맨 아래에 닿으면 마지막 섹션(리뷰가 짧아 위까지 못 올라오는 경우).
      if (current && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = TAB_ITEMS[TAB_ITEMS.length - 1].id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <Container aria-hidden className="mt-[64px] md:mt-[117px]">
        <div className="h-px w-full bg-[#A9A6A6]" />
      </Container>
      <nav
        aria-label="상품 상세 섹션 이동"
        className="sticky top-0 z-30 flex flex-wrap items-center justify-center gap-3 bg-surface-primary py-3 md:gap-[18px]"
      >
        {TAB_ITEMS.map((tab) => (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            aria-current={active === tab.id ? "location" : undefined}
            className={cn(
              "w-[86px] rounded-full py-1 text-center text-[14px] leading-5 font-normal tracking-[0.2px] transition-colors md:text-[15px]",
              active === tab.id
                ? "bg-brand-secondary text-ink-inverse"
                : "bg-white text-brand-secondary hover:bg-brand-highlight",
            )}
          >
            {tab.label}
          </a>
        ))}
      </nav>
    </>
  );
}
