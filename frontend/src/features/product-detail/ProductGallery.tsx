"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";
import type { ProductDetail } from "@/types/product-detail";

type ProductGalleryProps = {
  product: ProductDetail;
};

/**
 * 상품 상세의 대표 사진.
 *
 * 사진은 대표 이미지 + 목록 카드의 마우스 오버 이미지(hoverImageUrl)를 쓴다. 상품 사진이 정사각형(1600×1600)이라
 * 정사각형 틀에 그대로 넣는다(예전 3:4 틀은 좌우가 잘렸다). 모바일은 정사각형이라 첫 화면에 가격까지 보인다.
 *
 * - 모바일: 옆으로 밀어 넘긴다(스크롤 스냅). 오른쪽 아래 "1 / 2" 와 가운데 점으로 위치를 알린다.
 * - PC(lg 이상): 같은 줄을 손으로는 못 넘기고, 아래 썸네일을 누르면 그 사진으로 넘어간다.
 * 두 화면이 같은 이미지 요소를 써서 사진을 두 번 받지 않는다.
 */
export function ProductGallery({ product }: ProductGalleryProps) {
  const images = [...new Set([product.imageUrl, product.hoverImageUrl].filter((src): src is string => !!src))];
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
    setIndex(i);
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  return (
    // 모바일에선 Container 좌우 패딩(20px)을 음수 마진으로 상쇄해 화면 폭을 꽉 채운다.
    <div className="-mx-5 md:mx-0 lg:w-[583px] lg:flex-none">
      <div className="relative md:border md:border-[#B0AAA9]">
        {images.length === 0 ? (
          <div className="flex aspect-square w-full items-center justify-center">
            <span className="text-[40px] font-normal tracking-[-1px] text-ink-placeholder md:text-[56px]">제품이미지</span>
          </div>
        ) : (
          <div
            ref={trackRef}
            onScroll={onScroll}
            aria-roledescription="carousel"
            aria-label={`${product.name} 사진`}
            className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] lg:overflow-hidden [&::-webkit-scrollbar]:hidden"
          >
            {images.map((src, i) => (
              <div
                key={src}
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${images.length}`}
                className="relative aspect-square w-full flex-none snap-start"
              >
                <Image
                  src={src}
                  alt={i === 0 ? product.name : `${product.name} 사진 ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1024px) 583px, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {images.length > 1 ? (
          <>
            <div aria-hidden className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 lg:hidden">
              {images.map((src, i) => (
                <span key={src} className={cn("h-1.5 w-1.5 rounded-full", i === index ? "bg-black" : "bg-black/20")} />
              ))}
            </div>
            <span
              aria-hidden
              className="absolute bottom-3 right-3.5 rounded-full bg-black/55 px-2.5 py-0.5 text-[12px] text-white lg:hidden"
            >
              {index + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="mt-3 hidden gap-2.5 lg:flex">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`사진 ${i + 1} 보기`}
                aria-current={i === index}
                className={cn(
                  "relative block h-[84px] w-[84px] overflow-hidden bg-white",
                  i === index ? "border-2 border-[#212121]" : "border border-[#D6CBC8] hover:border-[#212121]",
                )}
              >
                <Image src={src} alt="" fill sizes="84px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
