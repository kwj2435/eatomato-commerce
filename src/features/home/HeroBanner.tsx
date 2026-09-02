"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";
import type { HeroBanner as HeroBannerType } from "@/types/banner";

type HeroBannerProps = {
  banners: HeroBannerType[];
  /** 자동 슬라이드 간격(ms). 0 으로 두면 자동재생을 끈다. */
  autoPlayInterval?: number;
};

const DEFAULT_INTERVAL = 5000;

/**
 * 메인 히어로 배너 슬라이더.
 *
 * 자동재생 + dot 인디케이터 + 클릭 이동을 갖춘 최소 슬라이더.
 * 외부 라이브러리를 쓰지 않고, 상태 하나(currentIndex)로 관리한다.
 * 사용자가 dot 을 누르면 타이머를 리셋해 UX 를 자연스럽게 만든다.
 *
 * 접근성:
 * - dot 버튼은 aria-label 로 몇 번째 슬라이드인지 알린다.
 * - 슬라이드 배너 자체는 링크(<Link/>)로 감싸 키보드 접근을 보장한다.
 */
export function HeroBanner({
  banners,
  autoPlayInterval = DEFAULT_INTERVAL,
}: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goTo = useCallback(
    (nextIndex: number) => {
      const safeIndex = ((nextIndex % banners.length) + banners.length) % banners.length;
      setCurrentIndex(safeIndex);
    },
    [banners.length],
  );

  useEffect(() => {
    if (autoPlayInterval <= 0 || banners.length <= 1) return;
    const id = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, autoPlayInterval);
    return () => window.clearInterval(id);
  }, [autoPlayInterval, banners.length, currentIndex]);

  if (banners.length === 0) return null;

  const current = banners[currentIndex];

  return (
    <section
      aria-label="메인 배너"
      aria-roledescription="carousel"
      className="relative flex h-[520px] w-full items-center justify-center overflow-hidden bg-surface-hero md:h-[680px] lg:h-[814px]"
    >
      {/* 슬라이드들: 절대 위치로 겹쳐 두고 opacity 로 크로스페이드 */}
      {banners.map((banner, index) => {
        const isActive = index === currentIndex;
        return (
          <Link
            key={banner.id}
            href={banner.href}
            aria-hidden={!isActive}
            tabIndex={isActive ? 0 : -1}
            aria-label={banner.alt}
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-700",
              isActive ? "z-[1] opacity-100" : "pointer-events-none z-0 opacity-0",
            )}
          >
            {banner.imageUrl ? (
              <Image
                src={banner.imageUrl}
                alt={banner.alt}
                fill
                priority={index === 0}
                sizes="(min-width: 1440px) 1440px, 100vw"
                className="object-cover"
              />
            ) : null}

            <div className="relative z-[1] flex w-full max-w-[980px] flex-col items-center gap-1 bg-surface-hero-caption px-6 py-10 md:px-10 md:py-[60px]">
              {banner.captionLines.map((line) => (
                <p
                  key={line}
                  className="text-center text-[28px] font-medium leading-[36px] tracking-[-0.6px] text-ink-primary md:text-[40px] md:leading-[48px] lg:text-[50px] lg:leading-[60px]"
                >
                  {line}
                </p>
              ))}
            </div>
          </Link>
        );
      })}

      <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-3">
        {banners.map((banner, index) => (
          <button
            key={banner.id}
            type="button"
            aria-label={`${index + 1}번째 배너로 이동`}
            aria-current={index === currentIndex ? "true" : undefined}
            onClick={() => goTo(index)}
            className={cn(
              "h-2.5 w-2.5 rounded-full border transition-colors",
              index === currentIndex
                ? "border-[#6B625B] bg-[#6B625B]"
                : "border-[#B9AFA6] bg-white hover:bg-[#E5DED6]",
            )}
          />
        ))}
      </div>

      <span className="sr-only" aria-live="polite">
        현재 {currentIndex + 1}번째 배너 · {current.alt}
      </span>
    </section>
  );
}
