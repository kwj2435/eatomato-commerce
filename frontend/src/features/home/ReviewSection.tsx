import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { MultilineText } from "@/components/ui/MultilineText";
import { listFeaturedReviews } from "@/lib/api/reviews";

import { PlaceholderGrid } from "./PlaceholderGrid";

/**
 * "Review" 섹션.
 * 대표 리뷰 4장(사진·글 두 줄·상품 칩)을 노출하고, 누르면 리뷰한 상품 상세로 간다.
 */
/** @param description 섹션 설명. 관리자 화면(문구)에서 고친다. 비어 있으면 설명 줄을 그리지 않는다. */
export async function ReviewSection({ description }: { description: string }) {
  const reviews = await listFeaturedReviews({ limit: 4 });

  return (
    <section aria-labelledby="review-title" className="pt-14 md:pt-[94px]">
      <Container>
        <h2
          id="review-title"
          className="text-[22px] font-medium tracking-[-0.2px] text-black md:text-[25px]"
        >
          Review
        </h2>
        {description ? (
          <p className="mt-4 text-[14px] font-normal leading-[22px] tracking-[-0.3px] text-ink-muted md:mt-[39px] md:text-[17.5px] md:leading-[25.1px]">
            <MultilineText text={description} />
          </p>
        ) : null}

        {reviews.length === 0 ? (
          <PlaceholderGrid label="리뷰사진" message="등록된 리뷰가 없습니다." />
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-[13px] md:mt-[66px] md:grid-cols-4">
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
