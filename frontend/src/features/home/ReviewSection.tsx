import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { listFeaturedReviews } from "@/lib/api/reviews";

import { SectionHeading } from "./SectionHeading";

/**
 * "Review" 섹션.
 * 대표 리뷰 4장(사진·글 두 줄·상품 칩)을 노출하고, 누르면 리뷰한 상품 상세로 간다.
 * 아직 리뷰가 없으면 포토후기 이벤트 배너를 보인다.
 */
/** @param description 섹션 설명. 관리자 화면(문구)에서 고친다. 비어 있으면 설명 줄을 그리지 않는다. */
export async function ReviewSection({ description }: { description: string }) {
  const reviews = await listFeaturedReviews({ limit: 4 });

  return (
    <section aria-labelledby="review-title" className="pt-14 md:pt-[94px]">
      <Container>
        <SectionHeading id="review-title" title="Review" description={description} />

        {/* 리뷰가 없으면 빈 자리 대신 후기 이벤트를 알린다(제안서 04). 후기가 생기면 자동으로 실제 후기로 바뀐다. */}
        {reviews.length === 0 ? (
          <ReviewEventBanner />
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-[13px] md:mt-10 md:grid-cols-4">
            {reviews.map((review) => (
              <li key={review.id}>
                <Link
                  href={`/products/${review.productSlug}`}
                  aria-label={`${review.productName} 리뷰 보러 가기`}
                  className="group flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  <span className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden bg-surface-elevated">
                    {review.imageUrl ? (
                      <Image
                        src={review.imageUrl}
                        alt={review.alt}
                        fill
                        sizes="(min-width: 1200px) 292px, (min-width: 768px) 40vw, 80vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-[28px] font-normal tracking-[-0.6px] text-ink-placeholder md:text-[40px]">
                        리뷰사진
                      </span>
                    )}
                  </span>

                  {/* 리뷰 글은 두 줄까지만 보이고 넘치면 말줄임(…) */}
                  <span className="mt-3 line-clamp-2 text-[13px] leading-[19px] tracking-[-0.3px] text-ink-body md:text-[14px] md:leading-[20px]">
                    {review.content}
                  </span>

                  <span className="mt-2.5 flex w-fit max-w-full items-center gap-2 bg-surface-elevated/60 p-1.5 pr-2.5">
                    <span className="relative h-8 w-8 flex-none overflow-hidden bg-surface-elevated">
                      {review.productImageUrl ? (
                        <Image src={review.productImageUrl} alt="" fill sizes="32px" className="object-cover" />
                      ) : null}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[11px] font-medium leading-[14px] text-ink-muted">
                        {review.productName}
                      </span>
                      <span aria-label={`별점 ${review.rating}점`} className="text-[11px] leading-[14px] tracking-[1px] text-brand-primary">
                        {"★★★★★".slice(0, review.rating)}
                        <span className="text-brand-primary/30">{"★★★★★".slice(review.rating)}</span>
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}

/** 후기가 하나도 없을 때 보이는 포토후기 이벤트 안내. 후기는 마이페이지 주문 내역에서 쓴다. */
function ReviewEventBanner() {
  return (
    <div className="mt-6 grid overflow-hidden bg-brand-highlight md:mt-10 md:grid-cols-[1.5fr_1fr]">
      <div className="flex flex-col justify-center px-6 py-8 md:px-12 md:py-12">
        <p className="text-[11px] font-semibold tracking-[1.6px] text-brand-primary md:text-[12px]">PHOTO REVIEW EVENT</p>
        <p className="mt-2 text-[21px] font-semibold tracking-[-0.4px] text-black md:mt-3 md:text-[28px]">첫 후기를 남겨주세요</p>
        <p className="mt-2 text-[13px] leading-[21px] tracking-[-0.3px] text-ink-muted md:mt-3 md:text-[15.5px] md:leading-[25px]">
          포토후기를 남기고 베스트리뷰로 선정되면,
          <br />
          잇토마토가 준비한 선물을 보내드려요
        </p>
        <Link
          href="/mypage"
          className="mt-5 inline-flex h-11 w-fit items-center bg-black px-5 text-[13px] font-medium tracking-[-0.2px] text-white transition-colors hover:bg-brand-secondary md:mt-7 md:h-12 md:px-6 md:text-[14px]"
        >
          후기 남기러 가기
        </Link>
      </div>
      <div aria-hidden className="hidden items-center justify-center bg-brand-badge/45 md:flex">
        <span className="text-center font-serif text-[40px] leading-[1.1] tracking-[1px] text-brand-secondary">
          REVIEW
          <br />
          EVENT
        </span>
      </div>
    </div>
  );
}
