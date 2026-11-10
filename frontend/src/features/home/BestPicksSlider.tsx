"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils/cn";
import type { HeroBanner } from "@/types/banner";

/**
 * Best Picks 왼쪽 이미지 슬라이더. 좌우 화살표로 넘기며, 이미지가 한 장이면 화살표를 숨긴다.
 * 섹션에서 가장 큰 사진이라 눌러 보는 사람이 많아, 사진 전체를 링크로 두고 왼쪽 아래에 "SHOP NOW →"를 붙인다.
 * 관리자가 배너에 링크를 넣으면 그곳으로, 비워 두면 fallbackHref 로 간다.
 * 화살표 버튼은 링크 밖(형제)에 둔다(링크 안에 버튼을 넣으면 누를 때 이동해 버린다).
 */
export function BestPicksSlider({ images, fallbackHref }: { images: HeroBanner[]; fallbackHref: string }) {
  const [index, setIndex] = useState(0);
  const go = (step: number) => setIndex((prev) => (prev + step + images.length) % images.length);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-surface-elevated md:aspect-auto md:min-h-full">
        <span className="text-[18px] tracking-[-0.3px] text-ink-placeholder md:text-[22px]">등록된 사진이 없습니다</span>
      </div>
    );
  }

  return (
    <div aria-roledescription="carousel" aria-label="Best Picks 이미지" className="relative aspect-square w-full overflow-hidden md:aspect-auto md:min-h-full">
      {images.map((image, i) => (
        <Link
          key={image.id}
          href={image.href ?? fallbackHref}
          aria-hidden={i !== index}
          tabIndex={i === index ? 0 : -1}
          aria-label={`${image.alt} · 제품 보러 가기`}
          className={cn(
            "group absolute inset-0 transition-opacity duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary",
            i === index ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          {image.imageUrl ? (
            <Image
              src={image.imageUrl}
              alt={image.alt}
              fill
              sizes="(min-width: 1200px) 600px, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          ) : null}
          <span
            aria-hidden
            className="absolute bottom-4 left-4 inline-flex h-10 items-center gap-2 bg-white px-[18px] text-[13px] font-bold tracking-[0.6px] text-ink-primary transition-colors group-hover:bg-ink-primary group-hover:text-ink-inverse md:bottom-6 md:left-6 md:h-[46px] md:px-[22px] md:text-[14px]"
          >
            SHOP NOW <span>→</span>
          </span>
        </Link>
      ))}

      {images.length > 1 ? (
        <>
          <ArrowButton direction="prev" onClick={() => go(-1)} />
          <ArrowButton direction="next" onClick={() => go(1)} />
          <span className="sr-only" aria-live="polite">
            {index + 1} / {images.length} · {images[index].alt}
          </span>
        </>
      ) : null}
    </div>
  );
}

function ArrowButton({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  const prev = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={prev ? "이전 이미지" : "다음 이미지"}
      className={cn(
        "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#B9AFA6] bg-white/40 text-[#8C7F77] transition-colors hover:bg-white/80",
        prev ? "left-4 md:left-6" : "right-4 md:right-6",
      )}
    >
      <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d={prev ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
