import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { listHeroBanners } from "@/lib/api/banners";

import { SectionHeading } from "./SectionHeading";

/**
 * "The Tomato Edit" 섹션(메인 상단 슬라이드 바로 아래).
 * 관리자가 올린 카드 이미지(배너 관리 > The Tomato Edit)를 순서대로 보이고, 이미지 아래 분홍 바에
 * "EDIT 01 · SHOP NOW" 를 붙인다. 카드를 누르면 관리자가 정한 주소로 간다.
 *
 * PC(md 이상): 한 줄에 세 장. 네 장 이상이면 다음 줄로 이어진다.
 * 모바일: 옆으로 넘겨 보는 가로 스크롤(스냅). 다음 카드가 살짝 보여 넘길 수 있다는 걸 알린다.
 */
/** @param description 섹션 설명. 관리자 화면(문구)에서 고친다. 비어 있으면 설명 줄을 그리지 않는다. */
export async function TomatoEditSection({ description }: { description: string }) {
  const banners = await listHeroBanners("EDIT");

  return (
    <section aria-labelledby="tomato-edit-title" className="pt-14 md:pt-[94px]">
      <Container>
        <SectionHeading id="tomato-edit-title" title="The Tomato Edit" description={description} />
      </Container>

      {/* 모바일에서는 화면 끝까지 넘겨 보이도록 Container 밖에서 좌우 여백을 직접 준다. */}
      <div className="mx-auto mt-6 w-full max-w-[1200px] md:mt-10 md:px-8 xl:px-0">
        <ul className="flex snap-x snap-mandatory scroll-px-5 gap-[10px] overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:grid md:grid-cols-3 md:gap-3 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
          {banners.length === 0
            ? Array.from({ length: 3 }, (_, i) => (
                <li key={i} aria-hidden className={cardClass}>
                  <div className="flex aspect-[3/4] items-center justify-center bg-surface-elevated">
                    <span className="text-[16px] text-ink-placeholder md:text-[20px]">에디트 이미지</span>
                  </div>
                  <EditBar index={i} />
                </li>
              ))
            : banners.map((banner, i) => (
                <li key={banner.id} className={cardClass}>
                  <Link
                    href={banner.href ?? "/"}
                    aria-label={`EDIT ${number(i)} · ${banner.alt}`}
                    className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-surface-elevated">
                      {banner.imageUrl ? (
                        <Image
                          src={banner.imageUrl}
                          alt={banner.alt}
                          fill
                          sizes="(min-width: 1200px) 392px, (min-width: 768px) 33vw, 76vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                    <EditBar index={i} />
                  </Link>
                </li>
              ))}
        </ul>
      </div>
    </section>
  );
}

/** 모바일은 화면의 76% 너비 카드를 옆으로 넘기고, PC 는 그리드 한 칸을 채운다. */
const cardClass = "w-[76%] flex-none snap-start md:w-auto";

const number = (i: number) => String(i + 1).padStart(2, "0");

/** 이미지 아래 분홍 바: 왼쪽 "EDIT 01", 오른쪽 밑줄 친 "SHOP NOW". */
function EditBar({ index }: { index: number }) {
  return (
    <div
      aria-hidden
      className="flex h-[38px] items-center justify-between bg-brand-badge px-3 text-ink-inverse md:h-[46px] md:px-4"
    >
      <span className="text-[13px] font-medium tracking-[0.2px] md:text-[15px]">EDIT {number(index)}</span>
      <span className="border-b border-current pb-px text-[10px] font-medium tracking-[0.4px] md:text-[11px]">
        SHOP NOW
      </span>
    </div>
  );
}
