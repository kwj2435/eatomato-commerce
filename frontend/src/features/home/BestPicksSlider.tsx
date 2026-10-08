"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils/cn";
import type { HeroBanner } from "@/types/banner";

/**
 * Best Picks 왼쪽 이미지 슬라이더. 관리자가 올린 이미지만 보이고 링크는 없다.
 * 좌우 화살표로 넘기며, 이미지가 한 장이면 화살표를 숨긴다.
 */
export function BestPicksSlider({ images }: { images: HeroBanner[] }) {
  const [index, setIndex] = useState(0);
  const go = (step: number) => setIndex((prev) => (prev + step + images.length) % images.length);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-surface-elevated">
        <span className="text-[18px] tracking-[-0.3px] text-ink-placeholder md:text-[22px]">등록된 사진이 없습니다</span>
      </div>
    );
  }

  return (
    <div aria-roledescription="carousel" aria-label="Best Picks 이미지" className="relative aspect-square w-full overflow-hidden">
      {images.map((image, i) => (
        <div
          key={image.id}
          aria-hidden={i !== index}
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
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
        </div>
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
