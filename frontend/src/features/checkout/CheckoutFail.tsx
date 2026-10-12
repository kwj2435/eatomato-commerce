"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { Container } from "@/components/layout/Container";
import { cancelGuestOrder } from "@/lib/api/guest";
import { cancelMyOrder } from "@/lib/api/orders";
import { useIsLoggedIn } from "@/lib/store/auth-store";
import { readGuestCheckout } from "@/lib/store/guest-checkout";
import { useHydrated } from "@/lib/store/use-hydrated";

import { tossErrorMessage } from "./useTossWidgets";

/**
 * 결제 실패 화면(= 토스 failUrl). ?code=&message=&orderId= 로 온다.
 * 결제되지 않은 주문이므로 결제대기 주문을 바로 취소해 재고를 돌려놓는다(장바구니 상품은 그대로 남는다).
 * 비회원은 주문서가 sessionStorage 에 둔 주문 비밀번호로 취소한다(없으면 30분 뒤 자동 취소).
 */
export function CheckoutFail() {
  const ready = useHydrated();
  const loggedIn = useIsLoggedIn();
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const message = tossErrorMessage({ code: params.get("code"), message: params.get("message") });
  const started = useRef(false);

  useEffect(() => {
    if (!ready || started.current || !orderId) return;
    started.current = true;
    if (loggedIn) {
      cancelMyOrder(orderId).catch(() => {});
      return;
    }
    const checkout = readGuestCheckout(orderId);
    if (checkout) cancelGuestOrder(orderId, checkout.password).catch(() => {});
  }, [ready, loggedIn, orderId]);

  return (
    <Container className="flex flex-col items-center gap-5 py-[120px] text-center">
      <p className="text-[18px] font-medium">결제를 마치지 못했어요</p>
      <p role="alert" className="text-[14px] text-brand-primary">{message}</p>
      <p className="text-[13px] text-ink-muted">결제되지 않은 주문은 취소되었어요. 장바구니에서 다시 주문해 주세요.</p>
      <Link href="/cart" className="border-[1.5px] border-black px-6 py-3 text-[14px] hover:bg-black hover:text-white">
        장바구니로
      </Link>
    </Container>
  );
}
