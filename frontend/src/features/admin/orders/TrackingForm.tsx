"use client";

import { useState } from "react";

import { updateAdminOrderTracking } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import type { AdminOrder } from "@/types/admin";

import { Button } from "../ui";

/** 자주 쓰는 택배사. 목록에 없는 택배사는 "기타" 를 고르고 이름을 직접 적는다. */
export const COURIERS = [
  "CJ대한통운",
  "우체국택배",
  "한진택배",
  "롯데택배",
  "로젠택배",
  "경동택배",
  "대신택배",
  "일양로지스",
  "합동택배",
  "CU편의점택배",
  "GS Postbox 택배",
] as const;

const OTHER = "__other__";

const fieldClass =
  "h-8 rounded-md border border-black/15 bg-white px-2 text-[13px] text-ink-body outline-none focus:border-brand-deep";

/** 송장이 있어야 배송중으로 바꿀 수 있다(서버 규칙과 같음). */
export function hasTracking(order: AdminOrder): boolean {
  return Boolean(order.courier && order.trackingNumber);
}

/**
 * 택배사·송장번호 입력. 저장하면 서버가 돌려준 주문으로 onSaved 를 부른다.
 * 결제가 끝난 주문(결제완료·배송중·배송완료)에서만 쓴다.
 */
export function TrackingForm({ order, onSaved }: { order: AdminOrder; onSaved: (updated: AdminOrder) => void }) {
  const saved = order.courier ?? "";
  const known = (COURIERS as readonly string[]).includes(saved);
  const [choice, setChoice] = useState<string>(saved ? (known ? saved : OTHER) : COURIERS[0]);
  const [customCourier, setCustomCourier] = useState(known ? "" : saved);
  const [number, setNumber] = useState(order.trackingNumber ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const courier = (choice === OTHER ? customCourier : choice).trim();
  const digits = number.replace(/\s/g, "");
  const dirty = courier !== saved || digits !== (order.trackingNumber ?? "");
  const valid = courier.length > 0 && /^[0-9A-Za-z-]{4,50}$/.test(digits);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return setError("택배사와 송장번호(숫자·영문 4자 이상)를 입력해 주세요.");
    setPending(true);
    setError(null);
    try {
      onSaved(await updateAdminOrderTracking(order.orderNumber, courier, digits));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <select
          aria-label={`주문 ${order.orderNumber} 택배사`}
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          className={`${fieldClass} w-[118px]`}
        >
          {COURIERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value={OTHER}>기타(직접 입력)</option>
        </select>
        {choice === OTHER ? (
          <input
            aria-label={`주문 ${order.orderNumber} 택배사 이름`}
            value={customCourier}
            onChange={(e) => setCustomCourier(e.target.value)}
            placeholder="택배사"
            maxLength={30}
            className={`${fieldClass} w-[90px]`}
          />
        ) : null}
        <input
          aria-label={`주문 ${order.orderNumber} 송장번호`}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="송장번호"
          inputMode="numeric"
          maxLength={60}
          className={`${fieldClass} w-[140px] tabular-nums`}
        />
        <Button type="submit" size="sm" disabled={pending || !dirty}>
          {pending ? "저장 중…" : hasTracking(order) ? "수정" : "저장"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-[12px] text-brand-primary">
          {error}
        </p>
      ) : null}
    </form>
  );
}
