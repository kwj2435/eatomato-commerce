"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Container } from "@/components/layout/Container";
import { searchPostcode } from "@/components/address/postcode";
import { errorMessage } from "@/lib/api/client";
import { createOrder } from "@/lib/api/orders";
import { useAuthStore } from "@/lib/store/auth-store";
import { useCartStore } from "@/lib/store/cart-store";
import { useRequireAuth } from "@/lib/store/use-require-auth";
import { cn } from "@/lib/utils/cn";
import { formatKRW } from "@/lib/utils/format";
import type { Member } from "@/types/member";
import { isRemoteArea, shippingFeeFor } from "@/types/shipping";

const MEMO_PRESETS = ["", "문 앞에 놓아 주세요", "경비실에 맡겨 주세요", "배송 전에 연락 주세요"];

/**
 * 주문서. 장바구니에서 선택한 상품의 배송지·연락처를 받고 결제로 넘어간다.
 *
 * 결제 흐름(PG 연동 준비):
 *   주문서 제출(POST /api/orders, 결제대기) → [PG 결제창] → 결제 완료 화면(/checkout/complete)에서 승인(confirm)
 * PG 를 붙이기 전이라 결제창 단계 없이 바로 완료 화면으로 넘어가고, 서버의 MOCK PG 가 승인을 가정한다.
 * PG 를 붙이면 handleSubmit 의 router.push 자리에 PG SDK 의 결제 요청(successUrl=/checkout/complete)을 넣는다.
 */
export function CheckoutView() {
  const ready = useRequireAuth();
  const member = useAuthStore((s) => s.member);
  const loaded = useCartStore((s) => s.loaded);
  const load = useCartStore((s) => s.load);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (ready) load().catch((e: unknown) => setLoadError(errorMessage(e)));
  }, [ready, load]);

  if (loadError) {
    return (
      <Container className="py-[120px] text-center">
        <p role="alert" className="text-[14px] text-brand-primary">{loadError}</p>
      </Container>
    );
  }
  if (!ready || !loaded || !member) {
    return (
      <Container className="py-14">
        <div className="h-[420px] animate-pulse bg-black/[0.04]" />
      </Container>
    );
  }
  // 회원 정보가 준비된 뒤에 폼을 그려, 회원 주소·연락처를 배송지 초기값으로 쓴다.
  return <CheckoutForm member={member} />;
}

function CheckoutForm({ member }: { member: Member }) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const policy = useCartStore((s) => s.policy);

  const [recipientName, setRecipientName] = useState(member.name ?? "");
  const [recipientPhone, setRecipientPhone] = useState(
    [member.phone.first, member.phone.middle, member.phone.last].filter(Boolean).join("-"),
  );
  const [zipCode, setZipCode] = useState(member.address.zipCode);
  const [roadAddress, setRoadAddress] = useState(member.address.road);
  const [detailAddress, setDetailAddress] = useState(member.address.detail);
  const [memoPreset, setMemoPreset] = useState("");
  const [memoCustom, setMemoCustom] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => items.filter((it) => it.selected), [items]);
  const subtotal = selected.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const shippingFee = policy
    ? shippingFeeFor({ baseFee: policy.standardFee, freeThreshold: policy.freeThreshold, remoteAreaFee: policy.remoteAreaFee }, subtotal, zipCode)
    : 0;
  const total = subtotal + shippingFee;
  const blocked = selected.some((it) => !it.available);

  const findAddress = async () => {
    try {
      const found = await searchPostcode();
      if (found) {
        setZipCode(found.zipCode);
        setRoadAddress(found.roadAddress);
      }
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const phone = recipientPhone.replace(/[^0-9]/g, "");
    if (!recipientName.trim()) return setError("받는 분 이름을 입력해 주세요.");
    if (!/^0\d{8,10}$/.test(phone)) return setError("연락처를 확인해 주세요. 예: 010-1234-5678");
    if (!/^\d{5}$/.test(zipCode) || !roadAddress) return setError("주소 검색으로 배송지를 입력해 주세요.");
    if (!agreed) return setError("주문 내용 확인 및 결제 진행에 동의해 주세요.");
    if (blocked) return setError("품절되었거나 재고가 부족한 상품이 있어요. 장바구니에서 정리해 주세요.");

    setPending(true);
    setError(null);
    try {
      const order = await createOrder({
        recipientName: recipientName.trim(),
        recipientPhone: phone,
        zipCode,
        roadAddress,
        detailAddress: detailAddress.trim(),
        deliveryMemo: (memoPreset === "직접 입력" ? memoCustom : memoPreset).trim(),
      });
      // PG 연동 전: 결제창 없이 결제가 성공했다고 보고 완료 화면으로 넘어간다(PG 의 successUrl 과 같은 형태).
      const qs = new URLSearchParams({
        orderNumber: order.orderNumber,
        paymentKey: `mock-${order.orderNumber}`,
        amount: String(order.total),
      });
      router.replace(`/checkout/complete?${qs}`);
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  };

  if (selected.length === 0) {
    return (
      <Container className="flex flex-col items-center gap-6 py-[120px]">
        <p className="text-[16px] text-ink-muted">주문할 상품이 없어요. 장바구니에서 상품을 선택해 주세요.</p>
        <Link href="/cart" className="border-[1.5px] border-black px-8 py-3 text-[15px] hover:bg-black hover:text-white">
          장바구니로
        </Link>
      </Container>
    );
  }

  return (
    <section className="w-full bg-[#FEF3EE] py-10 md:py-14">
      <Container>
        <h1 className="text-[22px] font-medium tracking-[-0.4px] text-black">주문서</h1>
        <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <Panel title="배송지">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="받는 분" htmlFor="co-name">
                  <input id="co-name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} maxLength={50} className={inputClass} autoComplete="name" />
                </Field>
                <Field label="연락처" htmlFor="co-phone">
                  <input id="co-phone" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} inputMode="tel" placeholder="010-1234-5678" maxLength={13} className={inputClass} autoComplete="tel" />
                </Field>
                <Field label="주소" htmlFor="co-zip" className="md:col-span-2">
                  <div className="flex gap-2">
                    <input id="co-zip" value={zipCode} readOnly placeholder="우편번호" className={cn(inputBase, "w-32 flex-none bg-black/[0.03]")} />
                    <button type="button" onClick={findAddress} className="h-11 flex-none whitespace-nowrap border border-black px-4 text-[14px] hover:bg-black hover:text-white">
                      주소 검색
                    </button>
                  </div>
                  <input value={roadAddress} readOnly placeholder="주소 검색을 눌러 주세요" aria-label="기본 주소" className={cn(inputClass, "mt-2 bg-black/[0.03]")} />
                  <input value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} placeholder="상세 주소 (동·호수 등)" aria-label="상세 주소" maxLength={200} className={cn(inputClass, "mt-2")} />
                  {isRemoteArea(zipCode) && policy ? (
                    <p className="mt-2 text-[13px] text-brand-primary">제주 지역은 추가 배송비 {formatKRW(policy.remoteAreaFee)}이 붙어요.</p>
                  ) : null}
                </Field>
                <Field label="배송 요청사항" htmlFor="co-memo" className="md:col-span-2">
                  <select id="co-memo" value={memoPreset} onChange={(e) => setMemoPreset(e.target.value)} className={inputClass}>
                    {MEMO_PRESETS.map((m) => (
                      <option key={m} value={m}>{m || "선택 안 함"}</option>
                    ))}
                    <option value="직접 입력">직접 입력</option>
                  </select>
                  {memoPreset === "직접 입력" ? (
                    <input value={memoCustom} onChange={(e) => setMemoCustom(e.target.value)} maxLength={200} placeholder="요청사항을 입력해 주세요" aria-label="배송 요청사항 직접 입력" className={cn(inputClass, "mt-2")} />
                  ) : null}
                </Field>
              </div>
            </Panel>

            <Panel title={`주문 상품 (${selected.length})`}>
              <ul className="divide-y divide-black/10">
                {selected.map((it) => (
                  <li key={it.id} className="flex items-start justify-between gap-4 py-3 text-[14px]">
                    <div className="min-w-0">
                      <p className="font-medium text-black">{it.name}</p>
                      {it.option ? <p className="mt-0.5 text-[13px] text-ink-muted">{it.option}</p> : null}
                      {!it.available ? <p className="mt-0.5 text-[13px] text-brand-primary">품절 또는 재고 부족</p> : null}
                    </div>
                    <p className="flex-none text-right tabular-nums">
                      {formatKRW(it.unitPrice * it.quantity)}
                      <span className="block text-[12px] text-ink-subtle">{it.quantity}개</span>
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <aside className="h-fit space-y-4 border-[1.5px] border-black bg-white p-6 lg:sticky lg:top-6">
            <h2 className="text-[16px] font-medium">결제 금액</h2>
            <Row label="상품 합계" value={formatKRW(subtotal)} />
            <Row label="배송비" value={shippingFee === 0 ? "무료" : formatKRW(shippingFee)} />
            <div className="h-px bg-black" />
            <Row label="총 결제 금액" value={formatKRW(total)} strong />
            <label className="flex items-start gap-2 text-[13px] leading-[19px] text-ink-muted">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
              주문 상품·금액·배송지를 확인했으며 결제 진행에 동의합니다.
            </label>
            {error ? <p role="alert" className="text-[13px] text-brand-primary">{error}</p> : null}
            <button
              type="submit"
              disabled={pending}
              className="h-[56px] w-full bg-black text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "처리 중…" : `${formatKRW(total)} 결제하기`}
            </button>
            <p className="text-[12px] leading-[18px] text-ink-subtle">
              결제 수단 연동 전이라 결제는 완료된 것으로 처리됩니다. 결제대기 상태로 30분이 지나면 주문이 자동 취소됩니다.
            </p>
          </aside>
        </form>
      </Container>
    </section>
  );
}

/** 폭을 뺀 입력칸 스타일(cn 이 클래스 충돌을 합치지 않아 폭은 따로 준다). */
const inputBase = "h-11 border border-black bg-white px-3 text-[14px] text-black outline-none focus:border-brand-primary";
const inputClass = `${inputBase} w-full`;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-[1.5px] border-black bg-white p-6">
      <h2 className="mb-4 text-[16px] font-medium">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, htmlFor, children, className }: { label: string; htmlFor: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] text-ink-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between tabular-nums", strong ? "text-[17px] font-bold" : "text-[14px]")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
