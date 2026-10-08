"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Container } from "@/components/layout/Container";
import { VirtualAccountInfo } from "@/components/order/VirtualAccountInfo";
import { errorMessage } from "@/lib/api/client";
import { getMyPoints, listMyCoupons } from "@/lib/api/benefits";
import { getMyMember } from "@/lib/api/member";
import { cancelMyOrder, listMyOrders } from "@/lib/api/orders";
import { listMyReviews } from "@/lib/api/reviews";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRequireAuth } from "@/lib/store/use-require-auth";
import { describeDiscount, describeMinOrder } from "@/lib/utils/coupon";
import { formatKRW, formatNoticeDate } from "@/lib/utils/format";
import type { MemberCoupon, PointEntry, Points } from "@/types/benefit";
import type { Member } from "@/types/member";
import { ORDER_STATUS_LABELS, type Order } from "@/types/order";
import type { MyReview } from "@/types/review";

import { HistorySection } from "./HistorySection";
import { MemberInfoForm } from "./MemberInfoForm";

/**
 * 아직 서버 기능이 없는 내역 블록. 주문·글·쿠폰·적립금은 서버 데이터로 따로 그린다.
 */
const PENDING_SECTIONS = [
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
  coupons: MemberCoupon[];
  points: Points;
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
    Promise.all([getMyMember(), listMyOrders(), listMyReviews(), listMyCoupons(), getMyPoints()])
      .then(([member, orders, reviews, coupons, points]) => {
        if (cancelled) return;
        setMember(member);
        setData({ member, orders, reviews, coupons, points });
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

          <HistorySection title="쿠폰 내역" emptyMessage="쿠폰 내역이 없습니다.">
            {data.coupons.length > 0 ? <CouponList coupons={data.coupons} /> : undefined}
          </HistorySection>

          <HistorySection
            title="적립금 내역"
            emptyMessage="적립금 내역이 없습니다."
            utility={
              <span id="points" className="text-[13px] tracking-[-0.2px] text-black">
                보유 적립금 <b className="text-brand-deep">{formatKRW(data.points.balance)}</b>
              </span>
            }
          >
            {data.points.history.length > 0 ? <PointList entries={data.points.history} /> : undefined}
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
      <span className="rounded-[4px] bg-brand-deep px-[5px] py-0.5 text-[10px] leading-3 tracking-[-0.2px] text-white">
        적립금
      </span>
    </>
  );
}

function OrderList({ orders: initial }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const cancel = async (order: Order) => {
    const message =
      order.status === "PAID"
        ? "주문을 취소할까요? 결제가 취소(환불)됩니다."
        : order.status === "AWAITING_DEPOSIT"
          ? "주문을 취소할까요? 안내받은 입금 계좌는 더 이상 쓸 수 없습니다."
          : "주문을 취소할까요?";
    if (!window.confirm(message)) return;
    try {
      const updated = await cancelMyOrder(order.orderNumber);
      setOrders((prev) => prev.map((o) => (o.orderNumber === updated.orderNumber ? updated : o)));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <ul className="border-t border-black">
      {error ? (
        <li role="alert" className="py-2 text-[13px] text-brand-primary">
          {error}
        </li>
      ) : null}
      {orders.map((order) => (
        <li key={order.orderNumber} className="border-b border-black/20 py-4">
          <div className="flex items-baseline justify-between gap-3 text-[13px] tracking-[-0.2px]">
            <span className="text-[#777]">
              {formatNoticeDate(order.orderedAt)} · 주문번호 {order.orderNumber}
            </span>
            <span className="flex-none">
              <span className={order.status === "CANCELLED" ? "mr-2 text-[#999]" : "mr-2 font-medium text-brand-primary"}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
              <span className="font-bold text-black">{formatKRW(order.total)}</span>
            </span>
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
          {order.couponDiscount + order.pointUsed > 0 || order.pointsEarned > 0 ? (
            <p className="mt-1.5 text-right text-[12px] text-[#777]">
              {[
                order.couponDiscount > 0 ? `쿠폰 -${formatKRW(order.couponDiscount)}` : null,
                order.pointUsed > 0 ? `적립금 사용 -${formatKRW(order.pointUsed)}` : null,
                order.pointsEarned > 0 ? `적립 +${formatKRW(order.pointsEarned)}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          {order.status === "AWAITING_DEPOSIT" && order.payment?.virtualAccount ? (
            <VirtualAccountInfo
              account={order.payment.virtualAccount}
              amount={order.total}
              className="mt-3 border border-brand-deep/40 bg-white px-3 py-2.5"
            />
          ) : null}
          {order.status === "PAID" && !order.cancellable && order.payment?.virtualAccount ? (
            <p className="mt-2 text-right text-[12px] text-[#999]">무통장입금 주문 취소는 고객센터로 요청해 주세요.</p>
          ) : null}
          {order.cancellable ? (
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => cancel(order)}
                className="text-[12px] text-[#777] underline-offset-2 hover:text-black hover:underline"
              >
                주문 취소
              </button>
            </div>
          ) : null}
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

const COUPON_STATUS_LABELS: Record<MemberCoupon["status"], string> = {
  AVAILABLE: "사용 가능",
  USED: "사용함",
  EXPIRED: "기한 지남",
};

/** 쿠폰: 사용 가능한 것을 위로, 그다음 사용함·기한 지남. */
function CouponList({ coupons }: { coupons: MemberCoupon[] }) {
  const sorted = [...coupons].sort((a, b) => Number(a.status !== "AVAILABLE") - Number(b.status !== "AVAILABLE"));
  return (
    <ul className="border-t border-black">
      {sorted.map((coupon) => {
        const available = coupon.status === "AVAILABLE";
        const condition = describeMinOrder(coupon);
        return (
          <li key={coupon.id} className="flex items-start justify-between gap-3 border-b border-black/20 py-3.5 text-[13px] tracking-[-0.2px]">
            <div className={available ? "min-w-0" : "min-w-0 text-[#999]"}>
              <p className="font-medium">{coupon.name}</p>
              <p className="mt-0.5">
                {describeDiscount(coupon)}
                {condition ? ` · ${condition}` : ""}
              </p>
              <p className="mt-0.5 text-[12px] text-[#999]">
                {coupon.expiresAt ? `${formatNoticeDate(coupon.expiresAt)}까지` : "기한 없음"}
              </p>
            </div>
            <span className={available ? "flex-none font-medium text-brand-deep" : "flex-none text-[#999]"}>
              {COUPON_STATUS_LABELS[coupon.status]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** 적립금 내역(최신순). 적립 +, 사용 -. */
function PointList({ entries }: { entries: PointEntry[] }) {
  return (
    <ul className="border-t border-black">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-baseline justify-between gap-3 border-b border-black/20 py-3 text-[13px] tracking-[-0.2px]">
          <div className="min-w-0">
            <p className="truncate">{entry.reason}</p>
            <p className="mt-0.5 text-[12px] text-[#999]">{formatNoticeDate(entry.createdAt)}</p>
          </div>
          <span className={entry.amount > 0 ? "flex-none font-medium text-brand-deep tabular-nums" : "flex-none tabular-nums text-[#777]"}>
            {entry.amount > 0 ? "+" : ""}
            {formatKRW(entry.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}
