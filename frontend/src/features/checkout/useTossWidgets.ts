"use client";

import { ANONYMOUS, loadTossPayments, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { useEffect, useRef, useState } from "react";

export const TOSS_METHODS_ID = "toss-payment-methods";
export const TOSS_AGREEMENT_ID = "toss-agreement";

/**
 * 토스페이먼츠 결제위젯(결제수단·약관 UI)을 #toss-payment-methods, #toss-agreement 에 그린다.
 * clientKey 가 null 이면(MOCK 결제) 아무것도 하지 않는다. 금액이 바뀌면(제주 배송비 등) 위젯 금액도 맞춘다.
 *
 * 개발 모드(StrictMode)는 effect 를 두 번 실행하는데, 같은 자리에 위젯이 두 번 그려지지 않도록
 * 렌더링을 다음 틱으로 미뤄 첫 실행이 정리(clearTimeout)되면 시작하지 않게 한다.
 */
export function useTossWidgets(clientKey: string | null, amount: number) {
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [error, setError] = useState<string | null>(null);
  const amountRef = useRef(amount);

  useEffect(() => {
    amountRef.current = amount;
  }, [amount]);

  useEffect(() => {
    if (!clientKey) return;
    let cancelled = false;
    const rendered: { destroy: () => Promise<void> }[] = [];

    const timer = setTimeout(async () => {
      try {
        const toss = await loadTossPayments(clientKey);
        const w = toss.widgets({ customerKey: ANONYMOUS });
        await w.setAmount({ currency: "KRW", value: amountRef.current });
        rendered.push(
          ...(await Promise.all([
            w.renderPaymentMethods({ selector: `#${TOSS_METHODS_ID}` }),
            w.renderAgreement({ selector: `#${TOSS_AGREEMENT_ID}` }),
          ])),
        );
        if (cancelled) {
          rendered.forEach((r) => r.destroy().catch(() => {}));
          return;
        }
        setWidgets(w);
      } catch (e) {
        if (!cancelled) setError(tossErrorMessage(e, "결제 수단을 불러오지 못했어요. 새로고침해 주세요."));
      }
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      setWidgets(null);
      rendered.forEach((r) => r.destroy().catch(() => {}));
    };
  }, [clientKey]);

  useEffect(() => {
    widgets?.setAmount({ currency: "KRW", value: amount }).catch(() => {});
  }, [widgets, amount]);

  return { widgets, error };
}

/** 토스 SDK 오류({ code, message })를 화면 문구로. 구매자가 결제창을 닫은 경우는 따로 안내한다. */
export function tossErrorMessage(e: unknown, fallback = "결제를 진행하지 못했어요. 다시 시도해 주세요."): string {
  const { code, message } = (e ?? {}) as { code?: string; message?: string };
  if (code === "USER_CANCEL" || code === "PAY_PROCESS_CANCELED") return "결제를 취소했어요.";
  return message || fallback;
}
