import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { listFeaturedReviews } from "@/lib/api/reviews";

/**
 * "Review" 섹션.
 * 각 제품 상세의 리뷰 탭으로 딥링크되는 대표 리뷰 4장을 노출한다.
 */
export async function ReviewSection() {
  const reviews = await listFeaturedReviews({ limit: 4 });

  return (
    <section aria-labelledby="review-title" className="pt-[94px]">
      <Container>
        <h2
          id="review-title"
          className="text-[25px] font-medium tracking-[-0.2px] text-black"
        >
          Review
        </h2>
        <p className="mt-[39px] text-[17.5px] font-normal leading-[25.1px] tracking-[-0.3px] text-ink-muted">
          신제품설명이들어갑니다신제품설명이
          <br />
          들어갑니다신제품설명이들어갑니다
        </p>

        <ul className="mt-[66px] grid grid-cols-2 gap-[13px] md:grid-cols-4">
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
