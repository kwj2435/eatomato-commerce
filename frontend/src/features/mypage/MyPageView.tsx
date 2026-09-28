"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Container } from "@/components/layout/Container";
import { errorMessage } from "@/lib/api/client";
import { getMyMember } from "@/lib/api/member";
import { listMyOrders } from "@/lib/api/orders";
import { listMyReviews } from "@/lib/api/reviews";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRequireAuth } from "@/lib/store/use-require-auth";
import { formatKRW, formatNoticeDate } from "@/lib/utils/format";
import type { Member } from "@/types/member";
import type { Order } from "@/types/order";
import type { MyReview } from "@/types/review";

import { HistorySection } from "./HistorySection";
import { MemberInfoForm } from "./MemberInfoForm";

/**
 * 아직 서버 기능이 없는 내역 블록. 주문 내역·내가 쓴 글은 서버 데이터로 따로 그린다.
 */
const PENDING_SECTIONS = [
  { key: "coupons", title: "쿠폰 내역", emptyMessage: "쿠폰 내역이 없습니다." },
  { key: "points", title: "적립금 내역", emptyMessage: "적립금 내역이 없습니다." },
  {
    key: "restock",
    title: "재입고 알림 내역",
    emptyMessage: "재입고 알림 내역이 없습니다.",
  },
] as const;

type MyPageData = {
  member: Member;
  orders: Order[];
  reviews: MyReview[];
};

/**
 * 마이페이지 본문 (시안 7p).
 *
 * 2단 구성: 좌측 513px 내역 / 간격 170px / 우측 517px 회원 정보 = 1200px 컨테이너.
 * lg 미만에서는 두 컬럼을 세로로 흘려 폭이 좁아도 폼이 찌그러지지 않게 한다.
 *
 * 회원 데이터는 로그인 토큰이 있어야 받을 수 있어 정적 빌드에 넣지 않고 브라우저에서 불러온다.
 * 비로그인이면 `useRequireAuth` 가 로그인 페이지로 보낸다.
 */
export function MyPageView() {
  const ready = useRequireAuth();
  const setMember = useAuthStore((s) => s.setMember);
  const [data, setData] = useState<MyPageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    Promise.all([getMyMember(), listMyOrders(), listMyReviews()])
      .then(([member, orders, reviews]) => {
        if (cancelled) return;
        setMember(member);
        setData({ member, orders, reviews });
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [ready, setMember]);

  if (error) {
    return (
      <Container as="section" className="pt-14">
        <p role="alert" className="flex h-[200px] items-center justify-center text-[14px] text-brand-primary">
          {error}
        </p>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container as="section" className="pt-14">
        <div className="h-[400px] w-full animate-pulse bg-black/[0.04]" />
      </Container>
    );
  }

  return (
    <section className="pt-14">
      <Container className="flex flex-col gap-16 lg:flex-row lg:items-start lg:gap-[170px]">
        <div className="w-full space-y-[63px] lg:w-[513px]">
          <HistorySection
            title="주문 내역"
            emptyMessage="주문 내역이 없습니다."
            utility={<OrderUtility />}
          >
            {data.orders.length > 0 ? <OrderList orders={data.orders} /> : undefined}
          </HistorySection>

          <HistorySection title="내가 쓴 글" emptyMessage="내가 쓴 글이 없습니다.">
            {data.reviews.length > 0 ? <ReviewList reviews={data.reviews} /> : undefined}
          </HistorySection>

          {PENDING_SECTIONS.map((section) => (
            <HistorySection
              key={section.key}
              title={section.title}
              emptyMessage={section.emptyMessage}
            />
          ))}
        </div>

        <div className="w-full lg:w-[517px]">
          <h2 className="text-[16px] font-bold leading-[22px] tracking-[-0.2px] text-black">
            회원 정보
          </h2>
          <MemberInfoForm member={data.member} />
        </div>
      </Container>
    </section>
  );
}

/** 주문 내역 상단 보조 영역 — 후기 작성 유도 링크 + 적립금 뱃지. */
function OrderUtility() {
  return (
    <>
      <Link
        href="/mypage/reviews/write"
        className="text-[12px] tracking-[-0.2px] text-[#9E9898] underline-offset-2 transition-colors hover:text-ink-muted hover:underline"
      >
        후기 쓰러 가기
      </Link>
      <span className="rounded-[4px] bg-[#9A9494] px-[5px] py-0.5 text-[10px] leading-3 tracking-[-0.2px] text-[#333030]">
        적립금
      </span>
    </>
  );
}

function OrderList({ orders }: { orders: Order[] }) {
  return (
    <ul className="border-t border-black">
      {orders.map((order) => (
        <li key={order.orderNumber} className="border-b border-black/20 py-4">
          <div className="flex items-baseline justify-between text-[13px] tracking-[-0.2px]">
            <span className="text-[#777]">
              {formatNoticeDate(order.orderedAt)} · 주문번호 {order.orderNumber}
            </span>
            <span className="font-bold text-black">{formatKRW(order.total)}</span>
          </div>
          <ul className="mt-2 space-y-1">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-[13px] tracking-[-0.2px] text-black">
                <Link href={`/products/${item.slug}`} className="min-w-0 truncate hover:underline">
                  {item.name}
                  {item.option ? <span className="text-[#777]"> ({item.option})</span> : null}
                </Link>
                <span className="flex-none text-[#545454]">
                  {item.quantity}개{item.reviewed ? " · 후기 작성" : ""}
                </span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function ReviewList({ reviews }: { reviews: MyReview[] }) {
  return (
    <ul className="border-t border-black">
      {reviews.map((review) => (
        <li key={review.id} className="border-b border-black/20 py-4 text-[13px] tracking-[-0.2px]">
          <div className="flex items-baseline justify-between gap-3">
            <Link href={`/products/${review.productSlug}#reviews`} className="min-w-0 truncate font-medium hover:underline">
              {review.productName}
            </Link>
            <span className="flex-none text-brand-primary" aria-label={`별점 ${review.rating}점`}>
              {"★".repeat(review.rating)}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[#333]">{review.content}</p>
          <p className="mt-1 text-[12px] text-[#999]">{formatNoticeDate(review.createdAt)}</p>
        </li>
      ))}
    </ul>
  );
}
