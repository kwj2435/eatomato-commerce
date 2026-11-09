"use client";

import Image from "next/image";
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
import { cn } from "@/lib/utils/cn";
import { describeDiscount, describeMinOrder } from "@/lib/utils/coupon";
import { formatKRW, formatNoticeDate } from "@/lib/utils/format";
import { formatTrackingNumber, trackingUrl } from "@/lib/utils/tracking";
import type { MemberCoupon, PointEntry, Points } from "@/types/benefit";
import type { Member } from "@/types/member";
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from "@/types/order";
import type { MyReview } from "@/types/review";

import { useLogout } from "@/features/auth/useLogout";

import { HistorySection } from "./HistorySection";
import { LoginProviderBadge } from "./LoginProviderBadge";
import { consumeProfileSavedFlag } from "./profile-saved";

type MyPageData = {
  member: Member;
  orders: Order[];
  reviews: MyReview[];
  coupons: MemberCoupon[];
  points: Points;
};

/**
 * 마이페이지 본문.
 *
 * 맨 위 인사·요약(등급·로그인 방식·회원 정보 수정 링크 + 주문·쿠폰·적립금 숫자) 아래로
 * 주문 내역과 혜택(쿠폰·적립금·내가 쓴 후기)을 보여 준다. 회원 정보 폼은 별도 페이지(/mypage/profile)다.
 * - PC(lg 이상): 왼쪽 주문 / 오른쪽 혜택 2단
 * - 모바일: 주문 → 쿠폰 → 적립금 → 후기 순으로 한 줄
 *
 * 회원 데이터는 로그인 토큰이 있어야 받을 수 있어 정적 빌드에 넣지 않고 브라우저에서 불러온다.
 * 비로그인이면 `useRequireAuth` 가 로그인 페이지로 보낸다.
 */
export function MyPageView() {
  const ready = useRequireAuth();
  const setMember = useAuthStore((s) => s.setMember);
  const [data, setData] = useState<MyPageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const justSaved = consumeProfileSavedFlag();
    let cancelled = false;
    Promise.all([getMyMember(), listMyOrders(), listMyReviews(), listMyCoupons(), getMyPoints()])
      .then(([member, orders, reviews, coupons, points]) => {
        if (cancelled) return;
        setMember(member);
        setData({ member, orders, reviews, coupons, points });
        setSaved(justSaved);
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
      <Container as="section" className="pt-8 md:pt-14">
        <div className="h-[400px] w-full animate-pulse bg-black/[0.04]" />
      </Container>
    );
  }

  const availableCoupons = data.coupons.filter((c) => c.status === "AVAILABLE").length;

  return (
    <section className="pb-6 pt-6 md:pt-12">
      <Container>
        {saved ? (
          <p role="status" className="mb-5 bg-[#212121] px-4 py-2.5 text-[13px] text-white">
            회원 정보를 저장했습니다.
          </p>
        ) : null}

        <Summary
          member={data.member}
          orderCount={data.orders.length}
          couponCount={availableCoupons}
          pointBalance={data.points.balance}
        />

        <div className="mt-9 flex flex-col gap-11 lg:mt-12 lg:flex-row lg:items-start lg:gap-[120px]">
          <div className="w-full lg:w-[600px] lg:flex-none">
            <HistorySection
              id="orders"
              title="주문 내역"
              aside={
                <Link href="/mypage/reviews/write" className="hover:text-black hover:underline">
                  후기를 쓰면 적립금을 드려요 ›
                </Link>
              }
              emptyMessage="아직 주문이 없어요."
              emptyAction={{ href: "/", label: "쇼핑하러 가기" }}
            >
              {data.orders.length > 0 ? <OrderList orders={data.orders} /> : undefined}
            </HistorySection>
          </div>

          <div className="flex w-full flex-col gap-11 lg:min-w-0 lg:flex-1">
            <HistorySection
              id="coupons"
              title="쿠폰"
              aside={availableCoupons > 0 ? `사용 가능 ${availableCoupons}장` : undefined}
              emptyMessage="받은 쿠폰이 없어요."
            >
              {data.coupons.length > 0 ? <CouponList coupons={data.coupons} /> : undefined}
            </HistorySection>

            <HistorySection id="points" title="적립금" aside="주문할 때 바로 쓸 수 있어요">
              <PointPanel points={data.points} />
            </HistorySection>

            <HistorySection
              id="reviews"
              title="내가 쓴 후기"
              aside={data.reviews.length > 0 ? `${data.reviews.length}개` : undefined}
              emptyMessage="아직 쓴 후기가 없어요."
              emptyAction={{ href: "/mypage/reviews/write", label: "후기 쓰러 가기" }}
            >
              {data.reviews.length > 0 ? <ReviewList reviews={data.reviews} /> : undefined}
            </HistorySection>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** 맨 위 인사·요약. 숫자를 누르면 해당 내역으로 내려간다. */
function Summary({
  member,
  orderCount,
  couponCount,
  pointBalance,
}: {
  member: Member;
  orderCount: number;
  couponCount: number;
  pointBalance: number;
}) {
  const stats = [
    { href: "#orders", label: "주문", value: `${orderCount}건` },
    { href: "#coupons", label: "쿠폰", value: `${couponCount}장` },
    { href: "#points", label: "적립금", value: formatKRW(pointBalance), accent: true },
  ];

  return (
    <div className="flex flex-col gap-4 border-b border-[#E3D6D3] pb-7 lg:flex-row lg:items-center lg:justify-between lg:pb-8">
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3">
          <h1 className="truncate text-[21px] font-bold tracking-[-0.4px] text-black md:text-[26px]">
            {member.nickname || member.name} 님
          </h1>
          <AccountActions className="flex lg:hidden" />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-ink-muted md:text-[14px]">
          <span className="rounded-full bg-[#F6E3DF] px-2 py-px text-[11.5px] font-semibold text-brand-secondary md:text-[12px]">
            {member.grade}
          </span>
          <LoginProviderBadge provider={member.loginProvider} />
          <AccountActions className="ml-1 hidden lg:flex" />
        </div>
      </div>

      <ul className="grid grid-cols-3 border border-[#E1D9D6] bg-white lg:w-[480px] lg:flex-none">
        {stats.map((stat, i) => (
          <li key={stat.href} className={i > 0 ? "border-l border-[#E1D9D6]" : undefined}>
            <a href={stat.href} className="flex flex-col items-center py-3 transition-colors hover:bg-black/[0.02] md:py-3.5">
              <span className="text-[12px] text-ink-subtle md:text-[13px]">{stat.label}</span>
              <span
                className={cn(
                  "mt-0.5 text-[16px] font-bold tracking-[-0.3px] md:text-[20px]",
                  stat.accent ? "text-brand-primary" : "text-black",
                )}
              >
                {stat.value}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 회원 정보 수정 링크 + 로그아웃. 모바일은 이름 옆, 데스크톱은 등급·로그인 방식 뒤에 둔다. */
function AccountActions({ className }: { className?: string }) {
  const logout = useLogout();
  return (
    <div className={cn("flex-none items-center gap-1.5", className)}>
      <Link
        href="/mypage/profile"
        className="inline-flex items-center whitespace-nowrap border border-[#212121] bg-white px-2.5 py-1 text-[12.5px] font-semibold text-black transition-colors hover:bg-black hover:text-white md:text-[13px]"
      >
        회원 정보 수정 ›
      </Link>
      <button
        type="button"
        onClick={logout}
        className="inline-flex items-center whitespace-nowrap border border-[#CFC5C2] bg-white px-2.5 py-1 text-[12.5px] text-ink-muted transition-colors hover:border-black hover:text-black md:text-[13px]"
      >
        로그아웃
      </button>
    </div>
  );
}

const STATUS_CHIP: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-[#ECE9E8] text-[#666]",
  AWAITING_DEPOSIT: "bg-[#FBEBD5] text-[#8A5A12]",
  PAID: "bg-[#F6E3DF] text-brand-primary",
  PREPARING: "bg-[#EFE6DA] text-[#6B4E2E]",
  SHIPPING: "bg-[#E4EFE6] text-[#2F6B3B]",
  DELIVERED: "bg-[#ECE9E8] text-[#545454]",
  CANCELLED: "bg-[#ECE9E8] text-[#999]",
};

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
    <ul className="flex flex-col gap-3">
      {error ? (
        <li role="alert" className="text-[13px] text-brand-primary">
          {error}
        </li>
      ) : null}
      {orders.map((order) => {
        const canReview = order.status === "DELIVERED" && order.items.some((item) => !item.reviewed);
        return (
          <li key={order.orderNumber} className="border border-[#E1D9D6] bg-white p-3.5 md:p-[18px]">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 text-[12px] text-ink-subtle md:text-[13px]">
                {formatNoticeDate(order.orderedAt).split(" ")[0]} ·{" "}
                <span className="whitespace-nowrap font-medium text-ink-muted">{order.orderNumber}</span>
              </span>
              <span
                className={cn(
                  "flex-none rounded-full px-2 py-0.5 text-[11.5px] font-semibold md:text-[12px]",
                  STATUS_CHIP[order.status],
                )}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>

            <ul className="mt-1">
              {order.items.map((item) => (
                <li key={item.id} className="mt-2.5 flex gap-3">
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative h-[54px] w-[54px] flex-none overflow-hidden bg-surface-primary md:h-16 md:w-16"
                    tabIndex={-1}
                    aria-hidden
                  >
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                    ) : null}
                  </Link>
                  <div className="min-w-0 text-[13px] tracking-[-0.2px] md:text-[14px]">
                    <Link href={`/products/${item.slug}`} className="block truncate font-medium text-black hover:underline">
                      {item.name}
                    </Link>
                    {item.option ? <p className="truncate text-[12px] text-ink-subtle md:text-[13px]">{item.option}</p> : null}
                    <p className="text-[12px] text-ink-muted md:text-[13px]">
                      {item.quantity}개 · {formatKRW(item.unitPrice * item.quantity)}
                      {item.reviewed ? <span className="text-ink-subtle"> · 후기 작성함</span> : null}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-[#F0E8E6] pt-2.5">
              <span className="min-w-0 text-[12px] text-ink-muted md:text-[13px]">{orderBreakdown(order)}</span>
              <span className="flex-none text-[15px] font-bold text-black md:text-[16px]">{formatKRW(order.total)}</span>
            </div>

            {order.tracking && (order.status === "SHIPPING" || order.status === "DELIVERED") ? (
              <a
                href={trackingUrl(order.tracking.courier, order.tracking.trackingNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 flex items-center justify-between gap-3 bg-[#F2F7F2] px-3 py-2 text-[12px] text-[#2F6B3B] hover:bg-[#E8F1E8] md:text-[13px]"
              >
                <span className="min-w-0 truncate">
                  {order.tracking.courier} · {formatTrackingNumber(order.tracking.trackingNumber)}
                </span>
                <span className="flex-none font-semibold">배송 조회 ›</span>
              </a>
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
            {order.status === "PREPARING" ? (
              <p className="mt-2 text-right text-[12px] text-[#999]">상품 준비가 시작되어 직접 취소할 수 없습니다. 고객센터로 문의해 주세요.</p>
            ) : null}

            {order.cancellable || canReview ? (
              <div className="mt-3 flex justify-end gap-2">
                {canReview ? (
                  <Link href="/mypage/reviews/write" className={cn(smallButton, "border-[#212121] font-semibold text-black")}>
                    후기 쓰기
                  </Link>
                ) : null}
                {order.cancellable ? (
                  <button type="button" onClick={() => cancel(order)} className={smallButton}>
                    주문 취소
                  </button>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

const smallButton =
  "flex h-[34px] min-w-[96px] items-center justify-center border border-[#CFC6C3] bg-white px-3 text-[12.5px] text-ink-body transition-colors hover:border-black hover:text-black";

/** "쿠폰 -2,000원 · 적립금 -500원 · 배송비 3,000원 · 적립 +1,248원" */
function orderBreakdown(order: Order): string {
  return [
    order.couponDiscount > 0 ? `쿠폰 -${formatKRW(order.couponDiscount)}` : null,
    order.pointUsed > 0 ? `적립금 -${formatKRW(order.pointUsed)}` : null,
    order.shippingFee > 0 ? `배송비 ${formatKRW(order.shippingFee)}` : "무료배송",
    order.pointsEarned > 0 ? `적립 +${formatKRW(order.pointsEarned)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function ReviewList({ reviews }: { reviews: MyReview[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {reviews.map((review) => (
        <li key={review.id} className="border border-[#E1D9D6] bg-white px-3.5 py-3 text-[13px] tracking-[-0.2px]">
          <div className="flex items-baseline justify-between gap-3">
            <Link href={`/products/${review.productSlug}#reviews`} className="min-w-0 truncate font-semibold text-black hover:underline">
              {review.productName}
            </Link>
            <span className="flex-none text-brand-primary" aria-label={`별점 ${review.rating}점`}>
              {"★".repeat(review.rating)}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[#333]">{review.content}</p>
          <p className="mt-1 text-[12px] text-[#999]">{formatNoticeDate(review.createdAt).split(" ")[0]}</p>
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

/** 쿠폰(티켓 모양): 사용 가능한 것을 위로, 그다음 사용함·기한 지남(흐리게). */
function CouponList({ coupons }: { coupons: MemberCoupon[] }) {
  const sorted = [...coupons].sort((a, b) => Number(a.status !== "AVAILABLE") - Number(b.status !== "AVAILABLE"));
  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((coupon) => {
        const available = coupon.status === "AVAILABLE";
        const condition = describeMinOrder(coupon);
        return (
          <li key={coupon.id} className={cn("flex border border-[#E1D9D6] bg-white", !available && "opacity-55")}>
            <div className="flex w-[88px] flex-none items-center justify-center border-r border-dashed border-[#D8C9C5] bg-surface-primary px-1 text-center text-[16px] font-extrabold tracking-[-0.4px] text-brand-primary">
              {coupon.discountType === "PERCENT" ? `${coupon.discountValue}%` : formatKRW(coupon.discountValue)}
            </div>
            <div className="min-w-0 flex-1 px-3 py-2.5 text-[12.5px] tracking-[-0.2px]">
              <p className="truncate text-[13.5px] font-semibold text-black">{coupon.name}</p>
              <p className="mt-0.5 text-ink-muted">
                {describeDiscount(coupon)}
                {condition ? ` · ${condition}` : ""}
              </p>
              <p className={cn("mt-0.5 text-[12px] font-medium", available ? "text-brand-primary" : "text-[#888]")}>
                {available ? couponDeadline(coupon.expiresAt) : `${COUPON_STATUS_LABELS[coupon.status]}${coupon.usedAt ? ` · ${formatNoticeDate(coupon.usedAt).split(" ")[0]}` : ""}`}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** "2026.12.31까지 · 58일 남음" / "기한 없음" */
function couponDeadline(expiresAt?: string): string {
  if (!expiresAt) return "기한 없음";
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
  const date = formatNoticeDate(expiresAt).split(" ")[0];
  return days >= 0 ? `${date}까지 · ${days === 0 ? "오늘까지" : `${days}일 남음`}` : `${date}까지`;
}

/** 보유 적립금 + 최근 내역(최신순). 적립 +, 사용 -. */
function PointPanel({ points }: { points: Points }) {
  return (
    <div className="border border-[#E1D9D6] bg-white">
      <div className="flex items-baseline justify-between px-3.5 py-3">
        <span className="text-[13px] text-ink-body">보유 적립금</span>
        <b className="text-[19px] tracking-[-0.3px] text-brand-primary">{formatKRW(points.balance)}</b>
      </div>
      {points.history.length === 0 ? (
        <p className="border-t border-[#F0E8E6] px-3.5 py-3 text-[12.5px] text-ink-subtle">
          아직 적립 내역이 없어요. 배송이 끝나거나 후기를 쓰면 적립돼요.
        </p>
      ) : (
        <ul>
          {points.history.map((entry: PointEntry) => (
            <li key={entry.id} className="flex items-baseline justify-between gap-3 border-t border-[#F5EEEC] px-3.5 py-2.5 text-[12.5px] tracking-[-0.2px]">
              <div className="min-w-0">
                <p className="truncate text-ink-body">{entry.reason}</p>
                <p className="mt-0.5 text-[11.5px] text-[#999]">{formatNoticeDate(entry.createdAt).split(" ")[0]}</p>
              </div>
              <span className={entry.amount > 0 ? "flex-none font-semibold tabular-nums text-brand-deep" : "flex-none tabular-nums text-[#777]"}>
                {entry.amount > 0 ? "+" : ""}
                {formatKRW(entry.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
