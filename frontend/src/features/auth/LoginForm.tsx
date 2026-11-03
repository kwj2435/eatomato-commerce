"use client";

import Link from "next/link";

import { KakaoLoginButton } from "./KakaoLoginButton";
import { NaverLoginButton } from "./NaverLoginButton";
import { useRedirectIfLoggedIn } from "@/lib/store/use-redirect-if-logged-in";
import { nextPathFromLocation } from "@/lib/utils/next-path";
import { startKakaoLogin } from "@/lib/api/kakao";
import { startNaverLogin } from "@/lib/api/naver";

/**
 * 로그인 화면.
 *
 * - 로그인·가입은 카카오·네이버로만 받는다(처음이면 자동 가입). 아이디·비밀번호 로그인은 없다.
 * - 로그인을 마치면 각 콜백 화면이 `?next=` 로 넘어온 화면(없으면 메인)으로 보낸다. 이미 로그인돼 있으면 바로 이동한다.
 */
export function LoginForm() {
  const redirecting = useRedirectIfLoggedIn();

  const handleKakao = () => startKakaoLogin(nextPathFromLocation());
  const handleNaver = () => startNaverLogin(nextPathFromLocation());

  if (redirecting) return <p className="py-20 text-center text-[14px] text-ink-muted">이미 로그인되어 있습니다. 이동 중…</p>;

  return (
    <div className="mx-auto w-full max-w-[510px] px-4">
      <div className="flex flex-col rounded-[24px] border border-[#F3DEDE] bg-[#FFFAFA] px-6 py-10 md:px-[51px] md:pb-[46px] md:pt-[60px]">
        <h1 className="text-center font-sans text-[30px] font-bold leading-tight tracking-[-0.5px] text-brand-secondary md:text-[36px]">
          Hello, tomato
        </h1>
        <p className="mt-2 text-center text-[14px] tracking-[-0.2px] text-[#6B6461]">
          오늘도 작은 토마토가 기다리고 있어요.
        </p>

        <div className="mt-[40px]">
          <KakaoLoginButton onClick={handleKakao} wide />
          <NaverLoginButton onClick={handleNaver} className="mt-3" />
        </div>

        <p className="mt-8 break-keep text-center text-[14px] tracking-[-0.2px] text-[#5E5552]">
          처음이면 카카오·네이버로 바로 가입돼요.
        </p>
        <Link
          href="/orders/guest"
          className="mx-auto mt-3 text-[14px] tracking-[-0.2px] text-[#5E5552] underline underline-offset-4 hover:text-brand-secondary"
        >
          비회원 주문 조회
        </Link>
      </div>
    </div>
  );
}
