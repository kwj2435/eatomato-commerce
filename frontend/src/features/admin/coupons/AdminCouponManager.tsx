"use client";

import { useCallback, useEffect, useState } from "react";

import { createAdminCoupon, issueAdminCoupon, listAdminCoupons, updateAdminCoupon } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { describeDiscount, describeMinOrder } from "@/lib/utils/coupon";
import type { AdminCoupon } from "@/types/admin";
import type { DiscountType } from "@/types/benefit";

import { formatDateTime } from "../format";
import { Button, Card, Chip, Empty, Field, Notice, PageHeader, inputClass, tableClass, tdClass, textareaClass, thClass } from "../ui";

/**
 * 쿠폰 관리: 만들기, 발급(전체 회원·특정 회원), 발급 중지/재개, 가입 자동 발급 설정.
 * 할인 조건은 이미 받은 회원이 있어 만든 뒤에는 바꾸지 않는다(새 쿠폰을 만들고 이전 쿠폰은 발급 중지).
 */
export function AdminCouponManager() {
  const [coupons, setCoupons] = useState<AdminCoupon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [issuing, setIssuing] = useState<AdminCoupon | null>(null);

  const load = useCallback(() => {
    listAdminCoupons()
      .then(setCoupons)
      .catch((e: unknown) => setError(errorMessage(e)));
  }, []);

  useEffect(load, [load]);

  const replace = (updated: AdminCoupon) =>
    setCoupons((prev) => (prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev));

  const toggle = async (coupon: AdminCoupon, patch: { active?: boolean; issueOnSignup?: boolean }) => {
    try {
      replace(await updateAdminCoupon(coupon.id, patch));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader
        title="쿠폰"
        description="할인은 상품 금액(배송비 제외)에만 붙고, 주문 한 건에 쿠폰 1장 + 적립금을 함께 쓸 수 있습니다. 주문이 취소되면 쿠폰은 돌려받습니다."
      />

      <CouponForm
        onCreated={(created) => {
          setCoupons((prev) => (prev ? [created, ...prev] : [created]));
          setNotice(`'${created.name}' 쿠폰을 만들었습니다. 목록에서 회원에게 발급하세요.`);
        }}
      />

      <Card className="mt-6">
        {error ? <Notice kind="error">{error}</Notice> : null}
        {notice ? <Notice kind="success">{notice}</Notice> : null}

        {!coupons ? (
          <div className="h-40 animate-pulse rounded-md bg-black/[0.04]" />
        ) : coupons.length === 0 ? (
          <Empty>쿠폰이 없습니다.</Empty>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>쿠폰</th>
                  <th className={thClass}>사용 기간</th>
                  <th className={`${thClass} text-right`}>발급 / 사용</th>
                  <th className={thClass}>가입 자동 발급</th>
                  <th className={thClass}>상태</th>
                  <th className={thClass}>
                    <span className="sr-only">발급</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td className={tdClass}>
                      <p className="font-medium text-ink-primary">{c.name}</p>
                      <p className="text-[12px] text-ink-subtle">
                        {describeDiscount(c)}
                        {describeMinOrder(c) ? ` · ${describeMinOrder(c)}` : ""}
                      </p>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-[12px]`}>
                      {c.validDays ? <span className="block">발급 후 {c.validDays}일</span> : null}
                      {c.validUntil ? <span className="block">{formatDateTime(c.validUntil)}까지</span> : null}
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-right tabular-nums`}>
                      {c.issuedCount.toLocaleString("ko-KR")} / {c.usedCount.toLocaleString("ko-KR")}
                    </td>
                    <td className={tdClass}>
                      <button type="button" onClick={() => toggle(c, { issueOnSignup: !c.issueOnSignup })} title="클릭해서 켜기/끄기">
                        <Chip tone={c.issueOnSignup ? "brand" : "muted"}>{c.issueOnSignup ? "켜짐" : "꺼짐"}</Chip>
                      </button>
                    </td>
                    <td className={tdClass}>
                      <button type="button" onClick={() => toggle(c, { active: !c.active })} title="클릭해서 발급 중지/재개">
                        <Chip tone={c.issuable ? "brand" : "muted"}>
                          {c.issuable ? "발급 중" : c.active ? "기간 종료" : "발급 중지"}
                        </Chip>
                      </button>
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <Button size="sm" disabled={!c.issuable} onClick={() => setIssuing(c)}>
                        발급
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {issuing ? (
        <IssueDialog
          coupon={issuing}
          onClose={() => setIssuing(null)}
          onDone={(message) => {
            setIssuing(null);
            setNotice(message);
            setError(null);
            load();
          }}
        />
      ) : null}
    </>
  );
}

function CouponForm({ onCreated }: { onCreated: (coupon: AdminCoupon) => void }) {
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("FIXED");
  const [discountValue, setDiscountValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [validDays, setValidDays] = useState("30");
  const [validUntil, setValidUntil] = useState("");
  const [issueOnSignup, setIssueOnSignup] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toNumber = (raw: string) => (raw.trim() === "" ? undefined : Math.floor(Number(raw)));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = toNumber(discountValue);
    if (!name.trim()) return setError("쿠폰 이름을 입력해 주세요.");
    if (!value || value < 1) return setError("할인 금액(또는 %)을 입력해 주세요.");
    if (discountType === "PERCENT" && value > 100) return setError("정률 할인은 100% 를 넘을 수 없습니다.");
    if (!toNumber(validDays) && !validUntil) return setError("사용 기간(발급 후 며칠 또는 종료일)을 정해 주세요.");
    setPending(true);
    setError(null);
    try {
      const created = await createAdminCoupon({
        name: name.trim(),
        discountType,
        discountValue: value,
        maxDiscount: discountType === "PERCENT" ? toNumber(maxDiscount) : undefined,
        minOrderAmount: toNumber(minOrderAmount) ?? 0,
        validDays: toNumber(validDays),
        validUntil: validUntil || undefined,
        issueOnSignup,
      });
      onCreated(created);
      setName("");
      setDiscountValue("");
      setMaxDiscount("");
      setMinOrderAmount("");
      setIssueOnSignup(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <form onSubmit={submit} noValidate>
        <h2 className="mb-4 text-[15px] font-bold">새 쿠폰</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="쿠폰 이름" htmlFor="cp-name" className="md:col-span-3">
            <input id="cp-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="예: 가을 감사 10% 쿠폰" className={inputClass} />
          </Field>
          <Field label="할인 방식" htmlFor="cp-type">
            <select id="cp-type" value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)} className={inputClass}>
              <option value="FIXED">정액 (원)</option>
              <option value="PERCENT">정률 (%)</option>
            </select>
          </Field>
          <Field label={discountType === "FIXED" ? "할인 금액 (원)" : "할인율 (%)"} htmlFor="cp-value">
            <input id="cp-value" value={discountValue} onChange={(e) => setDiscountValue(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" className={inputClass} />
          </Field>
          <Field label="최대 할인 (원)" hint="정률만. 비우면 상한 없음" htmlFor="cp-max">
            <input
              id="cp-max"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              disabled={discountType !== "PERCENT"}
              className={`${inputClass} disabled:bg-black/[0.03]`}
            />
          </Field>
          <Field label="최소 주문 금액 (원)" hint="상품 금액 기준. 비우면 조건 없음" htmlFor="cp-min">
            <input id="cp-min" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" className={inputClass} />
          </Field>
          <Field label="발급 후 사용 기간 (일)" hint="둘 다 넣으면 이른 날까지" htmlFor="cp-days">
            <input id="cp-days" value={validDays} onChange={(e) => setValidDays(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" className={inputClass} />
          </Field>
          <Field label="종료일" hint="이날 23:59 까지" htmlFor="cp-until">
            <input id="cp-until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={issueOnSignup} onChange={(e) => setIssueOnSignup(e.target.checked)} />
          신규 가입 회원에게 자동 발급
        </label>
        {error ? <p role="alert" className="mt-3 text-[13px] text-brand-primary">{error}</p> : null}
        <div className="mt-4 flex justify-end">
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "만드는 중…" : "쿠폰 만들기"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

/** 발급 대상 고르기: 전체 회원 또는 아이디 목록(줄바꿈·쉼표로 구분). */
function IssueDialog({ coupon, onClose, onDone }: { coupon: AdminCoupon; onClose: () => void; onDone: (message: string) => void }) {
  const [all, setAll] = useState(false);
  const [loginIds, setLoginIds] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const ids = loginIds.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    if (!all && ids.length === 0) return setError("발급할 회원 아이디를 입력해 주세요.");
    if (all && !window.confirm(`이용 중인 회원 전체에게 '${coupon.name}' 쿠폰을 발급할까요?\n이미 받은 회원은 건너뜁니다.`)) return;
    setPending(true);
    setError(null);
    try {
      const result = await issueAdminCoupon(coupon.id, all ? { all: true } : { all: false, loginIds: ids });
      onDone(
        `'${coupon.name}' ${result.issued.toLocaleString("ko-KR")}장 발급했습니다.` +
          (result.notFound.length ? ` 없는 아이디: ${result.notFound.join(", ")}` : ""),
      );
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="issue-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-[440px] rounded-lg bg-white p-6 shadow-xl">
        <h2 id="issue-title" className="text-[16px] font-bold">
          쿠폰 발급
        </h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          {coupon.name} · {describeDiscount(coupon)}. 이미 받은 회원은 건너뜁니다.
        </p>
        <div className="mt-4 space-y-2 text-[14px]">
          <label className="flex items-center gap-2">
            <input type="radio" checked={!all} onChange={() => setAll(false)} />
            특정 회원
          </label>
          <textarea
            value={loginIds}
            onChange={(e) => setLoginIds(e.target.value)}
            disabled={all}
            rows={4}
            placeholder={"회원 아이디를 줄바꿈이나 쉼표로 구분해 입력\n예: tomato01, tomato02"}
            className={`${textareaClass} disabled:bg-black/[0.03]`}
          />
          <label className="flex items-center gap-2">
            <input type="radio" checked={all} onChange={() => setAll(true)} />
            이용 중인 회원 전체
          </label>
        </div>
        {error ? <p role="alert" className="mt-3 text-[13px] text-brand-primary">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onClose} disabled={pending}>
            닫기
          </Button>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "발급 중…" : "발급"}
          </Button>
        </div>
      </form>
    </div>
  );
}
