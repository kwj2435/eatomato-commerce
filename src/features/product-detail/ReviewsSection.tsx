import Image from "next/image";

import { Container } from "@/components/layout/Container";
import type { ProductReview } from "@/types/product-detail";

type ReviewsSectionProps = {
  reviews: ProductReview[];
  reviewCount: number;
  /** 평균 별점(0~5). 소수점 첫째 자리까지 표기. */
  averageRating: number;
};

/**
 * REVIEWS 섹션.
 * 상단 배너 → 요약 → 리뷰 리스트.
 * "사진 후기만 보기" 필터는 필터 UI 만 표시하고 실 로직은 다음 이터레이션(별도 client 컴포넌트) 로.
 */
export function ReviewsSection({
  reviews,
  reviewCount,
  averageRating,
}: ReviewsSectionProps) {
  return (
    <Container as="section" id="reviews" className="scroll-mt-24 pt-[205px]">
      <h2 className="text-center text-[20px] font-normal tracking-[1.4px] text-brand-secondary">
        REVIEWS
      </h2>

      <div className="mt-[57px] flex h-[76px] w-full items-center justify-center bg-brand-primary text-center text-[18px] font-medium tracking-[-0.4px] text-white md:text-[22px]">
        텍스트 리뷰 200원 적립 ｜ 포토리뷰 500원 적립
      </div>

      <div className="flex h-[60px] items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[27px] font-normal tracking-[0.5px] text-[#545454]">
            {averageRating.toFixed(0)} / 5
          </span>
          <span className="text-[14px] tracking-[-0.2px] text-[#777]">
            ({reviewCount.toLocaleString("ko-KR")}개 후기)
          </span>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[14px] tracking-[-0.2px] text-[#545454]">
          <span
            aria-hidden
            className="inline-block h-[15px] w-[15px] border border-[#9A9A9A] bg-white"
          />
          <span>사진 후기만 보기</span>
        </label>
      </div>

      <div className="flex flex-col">
        {reviews.map((review) => (
          <ReviewRow key={review.id} review={review} />
        ))}
      </div>
    </Container>
  );
}

function ReviewRow({ review }: { review: ProductReview }) {
  return (
    <article className="flex items-start justify-between gap-8 border-t-2 border-brand-primary py-[18px] last:border-b-2 min-h-[135px]">
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-2.5">
          {review.isBest ? (
            <span className="bg-brand-primary px-2 py-0.5 text-[11px] font-bold tracking-[0.2px] text-white">
              BEST
            </span>
          ) : null}
          <span
            aria-label={`별점 ${review.rating}점`}
            className="flex gap-px text-[14px] tracking-[1px] text-brand-primary"
          >
            {"★★★★★".slice(0, review.rating)}
            <span className="text-brand-primary/30">
              {"★★★★★".slice(review.rating)}
            </span>
          </span>
          <span className="text-[13px] tracking-[-0.2px] text-[#545454]">
            {review.writer}
          </span>
        </div>
        <p className="text-[14px] leading-[1.5] tracking-[-0.3px] text-[#333]">
          {review.content}
        </p>
      </div>

      {review.imageUrl ? (
        <div className="relative h-[105px] w-[105px] flex-none overflow-hidden bg-[#EDEDED]">
          <Image
            src={review.imageUrl}
            alt="리뷰 사진"
            fill
            sizes="105px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-[105px] w-[105px] flex-none bg-[#EDEDED]" />
      )}
    </article>
  );
}
