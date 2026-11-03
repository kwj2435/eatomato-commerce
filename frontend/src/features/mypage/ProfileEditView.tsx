"use client";

import { useEffect, useState } from "react";

import { errorMessage } from "@/lib/api/client";
import { getMyMember } from "@/lib/api/member";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRequireAuth } from "@/lib/store/use-require-auth";
import type { Member } from "@/types/member";

import { MemberInfoForm } from "./MemberInfoForm";

/**
 * 회원 정보 수정 페이지(/mypage/profile). 마이페이지에서 폼을 떼어 낸 화면이다.
 * 저장하면 마이페이지로 돌아가 "저장했습니다" 를 보여 준다. 로그아웃·회원 탈퇴는 폼 맨 아래에 있다.
 */
export function ProfileEditView() {
  const ready = useRequireAuth();
  const setMember = useAuthStore((s) => s.setMember);
  const [member, setLocalMember] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getMyMember()
      .then((m) => {
        if (cancelled) return;
        setMember(m);
        setLocalMember(m);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [ready, setMember]);

  return (
    <section className="mx-auto w-full max-w-[520px] px-5 pb-16 pt-4 md:px-0 md:pt-12">
      {error ? (
        <p role="alert" className="flex h-[200px] items-center justify-center text-[14px] text-brand-primary">
          {error}
        </p>
      ) : member ? (
        <MemberInfoForm member={member} />
      ) : (
        <div className="h-[600px] w-full animate-pulse bg-black/[0.04]" />
      )}
    </section>
  );
}
