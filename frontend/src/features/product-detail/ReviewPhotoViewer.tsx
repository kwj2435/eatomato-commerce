"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ChevronDownIcon, CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

type ReviewPhotoViewerProps = {
  images: string[];
  /** 처음 보여줄 사진 위치 */
  startIndex?: number;
  onClose: () => void;
};

/**
 * 후기 사진 크게 보기. 화면 전체를 덮고, 사진을 옆으로 밀어 넘긴다(스크롤 스냅, ProductGallery 와 같은 방식).
 * PC 는 좌우 화살표 버튼·키보드 ←→ 로 넘긴다. 바깥(어두운 곳)·ESC·닫기 버튼으로 닫고, 열려 있는 동안 본문 스크롤을 잠근다.
 */
export function ReviewPhotoViewer({ images, startIndex = 0, onClose }: ReviewPhotoViewerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(startIndex);

  /** i 번째 사진으로 넘긴다. 범위를 벗어나면 끝 사진에서 멈춘다. */
  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.max(0, Math.min(images.length - 1, i));
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    setIndex(next);
  };

  // 처음 그릴 때 누른 사진 위치로 바로 옮긴다(애니메이션 없이).
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (track) track.scrollLeft = startIndex * track.clientWidth;
  }, [startIndex]);

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    // ←→ 는 지금 스크롤 위치에서 한 장씩. 상태 대신 DOM 위치를 읽어 핸들러를 다시 달 필요가 없다.
    const step = (delta: number) => {
      const track = trackRef.current;
      if (!track || track.clientWidth === 0) return;
      const current = Math.round(track.scrollLeft / track.clientWidth);
      const last = Math.round(track.scrollWidth / track.clientWidth) - 1;
      const next = Math.max(0, Math.min(last, current + delta));
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  const many = images.length > 1;

  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="후기 사진"
      className="fixed inset-0 z-[50] flex flex-col bg-black/95 outline-none"
    >
      <div className="flex h-14 flex-none items-center justify-between px-4 text-white">
        <span aria-live="polite" className="text-[14px] tracking-[0.2px]">
          {many ? `${index + 1} / ${images.length}` : ""}
        </span>
        <button type="button" onClick={onClose} aria-label="사진 닫기" className="p-2 text-white/80 hover:text-white">
          <CloseIcon width={18} height={18} />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={trackRef}
          onScroll={onScroll}
          aria-roledescription="carousel"
          className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            // 사진 바깥(빈 곳)을 누르면 닫는다.
            <div
              key={`${src}-${i}`}
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${images.length}`}
              onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
              }}
              className="relative h-full w-full flex-none snap-start"
            >
              <Image
                src={src}
                alt={`후기 사진 ${i + 1}`}
                fill
                sizes="100vw"
                className="pointer-events-none object-contain"
              />
            </div>
          ))}
        </div>

        {many ? (
          <>
            <ArrowButton direction="prev" disabled={index === 0} onClick={() => goTo(index - 1)} />
            <ArrowButton direction="next" disabled={index === images.length - 1} onClick={() => goTo(index + 1)} />
          </>
        ) : null}
      </div>

      {many ? (
        <div aria-hidden className="flex h-12 flex-none items-center justify-center gap-1.5 pb-[env(safe-area-inset-bottom)]">
          {images.map((src, i) => (
            <span key={`${src}-${i}`} className={cn("h-1.5 w-1.5 rounded-full", i === index ? "bg-white" : "bg-white/30")} />
          ))}
        </div>
      ) : null}
    </div>,
    document.body,
  );
}

/** PC 용 좌우 화살표. 모바일은 손으로 밀어 넘기므로 숨긴다. */
function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "이전 사진" : "다음 사진"}
      className={cn(
        "absolute top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-3 text-white transition-colors hover:bg-white/30 disabled:opacity-0 md:block",
        direction === "prev" ? "left-4" : "right-4",
      )}
    >
      <ChevronDownIcon width={20} height={20} className={direction === "prev" ? "rotate-90" : "-rotate-90"} />
    </button>
  );
}
