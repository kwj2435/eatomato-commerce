"use client";

import Link from "next/link";
import { useState } from "react";

import { errorMessage } from "@/lib/api/client";
import { withdrawMember } from "@/lib/api/member";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRequireAuth } from "@/lib/store/use-require-auth";

/** 탈퇴하면 생기는 일. 서버 동작(MemberWithdrawalService)과 개인정보 처리방침에 맞춰 적는다. */
const NOTICES = [
  "이름·이메일·연락처·주소 등 회원 정보는 바로 지워지며 되돌릴 수 없습니다.",
  "보유한 쿠폰과 적립금은 모두 소멸합니다.",
  "주문·결제 기록은 전자상거래법에 따라 5년 동안 보관한 뒤 파기합니다.",
  "작성한 후기는 작성자가 '탈퇴한 회원'으로 바뀌어 남습니다.",
  "같은 카카오·네이버 계정으로 다시 가입할 수 있지만, 신규가입 혜택은 다시 드리지 않습니다.",
  "결제·입금을 기다리거나 배송 중인 주문이 있으면 탈퇴할 수 없습니다.",
];

export function WithdrawView() {
  const ready = useRequireAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return <div className="mx-auto h-[420px] max-w-[446px] animate-pulse bg-black/[0.04]" />;

  const handleWithdraw = async () => {
    if (!confirmed) return setError("안내 사항을 확인하고 동의해 주세요.");
    setPending(true);
    setError(null);
    try {
      await withdrawMember();
      window.alert("탈퇴가 완료되었습니다. 그동안 eatomato 를 이용해 주셔서 감사합니다.");
      // 서버가 토큰을 모두 폐기했으니 이 브라우저의 세션만 지운다.
      // 세션이 지워지면 useRequireAuth 가 로그인 화면으로 보내려 하므로, 새로 불러오며 메인으로 이동한다.
      useAuthStore.getState().clear();
      window.location.replace("/");
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-[446px] flex-col px-4 py-6 md:px-3.5 md:py-2.5">
      <h1 className="text-[18px] font-medium tracking-[-0.3px] text-black">회원 탈퇴</h1>
      <p className="mt-2 text-[14px] leading-[21px] text-ink-muted">탈퇴하기 전에 아래 내용을 꼭 확인해 주세요.</p>

      <ul className="mt-7 flex list-disc flex-col gap-2.5 border-y border-black py-5 pl-9 pr-4 text-[14px] leading-[21px] text-ink-body">
        {NOTICES.map((notice) => (
          <li key={notice} className="break-keep">
            {notice}
          </li>
        ))}
      </ul>

      <label className="mt-6 flex cursor-pointer items-center gap-2.5 text-[14px] text-black">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="h-[18px] w-[18px] accent-black"
        />
        안내 사항을 확인했으며 탈퇴에 동의합니다.
      </label>

      <div className="mt-[45px] flex gap-3">
        <Link
          href="/mypage"
          className="flex h-[59px] flex-1 items-center justify-center border border-black text-[15px] transition-colors hover:bg-black hover:text-white"
        >
          취소
        </Link>
        <button
          type="button"
          onClick={handleWithdraw}
          disabled={pending || !confirmed}
          className="h-[59px] flex-1 bg-black text-[15px] text-white transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {pending ? "처리 중…" : "탈퇴하기"}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-6 break-keep text-center text-[13px] text-brand-primary">
          {error}
        </p>
      ) : null}
    </section>
  );
}
