"use client";

import { useEffect, useState } from "react";

import { errorMessage } from "@/lib/api/client";
import { getAdminShippingPolicy, updateAdminShippingPolicy } from "@/lib/api/shipping";
import { formatKRW } from "@/lib/utils/format";
import type { ShippingPolicy } from "@/types/shipping";

import { formatDateTime } from "../format";
import { Button, Card, Field, Notice, PageHeader, inputClass } from "../ui";

/**
 * 배송비 정책. 장바구니·주문 금액 계산은 저장 즉시, 상품 상세 안내 문구는 1분 안에 반영된다.
 * 제주(우편번호 63…) 추가 배송비는 무료배송이어도 붙는다.
 */
export function AdminShippingPolicy() {
  const [policy, setPolicy] = useState<ShippingPolicy | null>(null);
  const [form, setForm] = useState({ baseFee: "", freeThreshold: "", remoteAreaFee: "" });
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  const apply = (p: ShippingPolicy) => {
    setPolicy(p);
    setForm({ baseFee: String(p.baseFee), freeThreshold: String(p.freeThreshold), remoteAreaFee: String(p.remoteAreaFee) });
  };

  useEffect(() => {
    getAdminShippingPolicy().then(apply).catch((e: unknown) => setMessage({ kind: "error", text: errorMessage(e) }));
  }, []);

  const numbers = {
    baseFee: Number(form.baseFee),
    freeThreshold: Number(form.freeThreshold),
    remoteAreaFee: Number(form.remoteAreaFee),
  };
  const valid = Object.values(form).every((v) => v !== "" && Number.isInteger(Number(v)) && Number(v) >= 0);

  const save = async () => {
    if (!valid) {
      setMessage({ kind: "error", text: "0 이상의 정수로 입력해 주세요." });
      return;
    }
    if (!window.confirm("배송비 정책을 바꿀까요? 장바구니·주문 금액에 바로 반영됩니다.")) return;
    setPending(true);
    try {
      apply(await updateAdminShippingPolicy(numbers));
      setMessage({ kind: "success", text: "저장했습니다. 상품 상세 안내 문구는 1분 안에 반영됩니다." });
    } catch (e) {
      setMessage({ kind: "error", text: errorMessage(e) });
    } finally {
      setPending(false);
    }
  };

  const preview = valid
    ? numbers.freeThreshold <= 0
      ? "전 상품 무료배송"
      : `${formatKRW(numbers.baseFee)} (${formatKRW(numbers.freeThreshold)} 이상 구매 시 무료)`
    : "—";

  return (
    <>
      <PageHeader title="배송비" description="사이트 전체의 배송비 계산과 안내 문구에 쓰입니다." />
      {message ? (
        <div className="mb-4">
          <Notice kind={message.kind}>{message.text}</Notice>
        </div>
      ) : null}
      {!policy ? (
        <div className="h-60 animate-pulse rounded-lg bg-black/[0.04]" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card title="정책">
            <div className="space-y-4">
              <Field label="기본 배송비 (원)" htmlFor="sp-base">
                <input id="sp-base" type="number" min={0} value={form.baseFee} onChange={(e) => setForm({ ...form, baseFee: e.target.value })} className={inputClass} />
              </Field>
              <Field label="무료배송 기준 (원)" htmlFor="sp-free" hint="상품 합계가 이 금액 이상이면 기본 배송비가 무료입니다. 0 이면 항상 무료.">
                <input id="sp-free" type="number" min={0} value={form.freeThreshold} onChange={(e) => setForm({ ...form, freeThreshold: e.target.value })} className={inputClass} />
              </Field>
              <Field label="제주 추가 배송비 (원)" htmlFor="sp-remote" hint="우편번호가 63으로 시작하는 제주 지역에 더합니다. 무료배송이어도 붙습니다. 도서 산간 전체 목록은 아직 반영하지 않았습니다.">
                <input id="sp-remote" type="number" min={0} value={form.remoteAreaFee} onChange={(e) => setForm({ ...form, remoteAreaFee: e.target.value })} className={inputClass} />
              </Field>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-ink-subtle">
                  {policy.updatedAt ? `마지막 수정 ${formatDateTime(policy.updatedAt)}` : null}
                </span>
                <Button variant="primary" disabled={pending} onClick={save}>
                  {pending ? "저장 중…" : "저장"}
                </Button>
              </div>
            </div>
          </Card>
          <Card title="사이트에 보이는 문구 (미리보기)">
            <dl className="space-y-3 text-[14px]">
              <div>
                <dt className="text-[12px] text-ink-subtle">상품 상세 · 배송비</dt>
                <dd>{preview}</dd>
                {valid && numbers.remoteAreaFee > 0 ? <dd className="text-ink-muted">제주 지역 {formatKRW(numbers.remoteAreaFee)} 추가</dd> : null}
              </div>
              <div>
                <dt className="text-[12px] text-ink-subtle">예시 계산</dt>
                {valid
                  ? [20_000, numbers.freeThreshold].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((amount) => (
                      <dd key={amount} className="tabular-nums">
                        상품 {formatKRW(amount)} → 배송비 {formatKRW(amount >= numbers.freeThreshold ? 0 : numbers.baseFee)}
                        {numbers.remoteAreaFee > 0 ? ` (제주 ${formatKRW((amount >= numbers.freeThreshold ? 0 : numbers.baseFee) + numbers.remoteAreaFee)})` : ""}
                      </dd>
                    ))
                  : null}
              </div>
            </dl>
          </Card>
        </div>
      )}
    </>
  );
}
