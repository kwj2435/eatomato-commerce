import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { MultilineText } from "@/components/ui/MultilineText";
import { listFeaturedReviews } from "@/lib/api/reviews";

/**
 * "Review" 섹션.
 * 각 제품 상세의 리뷰 탭으로 딥링크되는 대표 리뷰 4장을 노출한다.
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

        <ul className="mt-8 grid grid-cols-2 gap-[13px] md:mt-[66px] md:grid-cols-4">
          {reviews.map((review) => (
            <li key={review.id}>
              <Link
                href={`/products/${review.productSlug}#reviews`}
                aria-label={review.alt}
                className="group relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden bg-surface-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                {review.imageUrl ? (
                  <Image
                    src={review.imageUrl}
                    alt={review.alt}
                    fill
                    sizes="(min-width: 1200px) 292px, (min-width: 768px) 40vw, 80vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="text-[60px] font-normal tracking-[-1.2px] text-ink-placeholder">
                    리뷰사진
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
