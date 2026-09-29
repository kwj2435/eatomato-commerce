"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ApiError, errorMessage } from "@/lib/api/client";
import { completeKakaoLogin, takeKakaoNextPath } from "@/lib/api/kakao";
import { hasSession, useAuthStore } from "@/lib/store/auth-store";

/**
 * 카카오 인가 후 돌아오는 화면(/login/kakao/). 인가 코드를 백엔드에 넘겨 로그인을 마친다.
 * 인가 코드는 한 번만 쓸 수 있어, 개발 모드의 이중 effect 실행에도 요청이 한 번만 가도록 막는다.
 *
 * 이미 로그인된 상태로 들어오면(로그인 후 뒤로가기로 카카오 인가 주소를 다시 거친 경우 등)
 * 코드를 쓰지 않고 원래 가려던 화면으로 보낸다. 예전에는 여기서 오류 화면이 떠 로그아웃된 것처럼 보였다.
 */
export function KakaoCallback() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (hasSession()) {
      router.replace(takeKakaoNextPath());
      return;
    }
    completeKakaoLogin(new URLSearchParams(window.location.search))
      .then(({ session, next }) => {
        setSession(session);
        // 카카오로 처음 가입했거나 정보가 비어 있으면 추가 정보 입력을 먼저 거친다.
        router.replace(
          session.member.profileComplete ? next : `/signup/profile?next=${encodeURIComponent(next)}`,
        );
      })
      .catch((e: unknown) => setError(callbackError(e)));
  }, [router, setSession]);

  return (
    <div className="mx-auto flex max-w-[446px] flex-col items-center gap-6 py-[120px] text-center">
      {error ? (
        <>
          <p role="alert" className="text-[15px] text-brand-primary">
            {error}
          </p>
          <Link href="/login" className="border border-black px-8 py-3 text-[15px] hover:bg-black hover:text-white">
            로그인 화면으로
          </Link>
        </>
      ) : (
        <p className="text-[15px] text-ink-muted">카카오 로그인 중입니다…</p>
      )}
    </div>
  );
}

/** 서버 응답(ApiError)과 우리가 던진 안내(Error)는 문구 그대로, 네트워크 오류(TypeError)는 공통 문구로. */
function callbackError(e: unknown): string {
  if (e instanceof ApiError || !(e instanceof Error) || e instanceof TypeError) return errorMessage(e);
  return e.message;
}
