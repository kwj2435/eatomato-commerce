"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthField as Field } from "./AuthField";
import { KakaoLoginButton } from "./KakaoLoginButton";
import { login } from "@/lib/api/auth";
import { useRedirectIfLoggedIn } from "@/lib/store/use-redirect-if-logged-in";
import { afterLoginPath, nextPathFromLocation } from "@/lib/utils/next-path";
import { startKakaoLogin } from "@/lib/api/kakao";
import { errorMessage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

type Status =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

/**
 * 로그인 폼.
 *
 * - 아이디 또는 이메일 + 비밀번호로 `/api/auth/login` 을 호출하고, 받은 토큰을 세션 스토어에 저장한다.
 * - 성공하면 `?next=` 로 넘어온 화면(없으면 메인)으로 이동한다. 이미 로그인돼 있으면 폼 없이 바로 이동한다.
 * - 가입·로그인 수단은 이메일과 카카오 두 가지만 둔다. 카카오는 처음이면 자동 가입된다.
 */
export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const redirecting = useRedirectIfLoggedIn();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id.trim() || !password) {
      setStatus({ kind: "error", message: "아이디와 비밀번호를 모두 입력해 주세요." });
      return;
    }
    setPending(true);
    try {
      const session = await login(id.trim(), password);
      setSession(session);
      router.replace(afterLoginPath(session.member.profileComplete));
    } catch (error) {
      setStatus({ kind: "error", message: errorMessage(error) });
      setPending(false);
    }
  };

  const handleKakao = () => startKakaoLogin(nextPathFromLocation());

  if (redirecting) return <p className="py-20 text-center text-[14px] text-ink-muted">이미 로그인되어 있습니다. 이동 중…</p>;

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-[446px] flex-col bg-surface-util px-4 py-6 md:px-3.5 md:py-2.5"
    >
      <Field
        label="아이디 또는 이메일"
        id="login-id"
        type="text"
        autoComplete="username"
        value={id}
        onChange={setId}
      />

      <Field
        label="비밀번호"
        id="login-pw"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        className="mt-[25px]"
      />

      <div className="mt-[25px] flex flex-wrap items-center justify-center gap-x-[30px] gap-y-2">
        <Link
          href="/forgot-password"
          className="text-[15px] font-normal leading-[15px] tracking-[-0.2px] underline-offset-2 hover:underline"
        >
          비밀번호 찾기
        </Link>
        <Link
          href="/orders/guest"
          className="text-[15px] font-normal leading-[15px] tracking-[-0.2px] underline-offset-2 hover:underline"
        >
          비회원 주문 조회하기
        </Link>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mx-auto mt-[55px] disabled:opacity-50 h-[59px] w-full max-w-[264px] border border-black text-[15px] font-normal tracking-[-0.2px] text-black transition-colors hover:bg-black hover:text-white"
      >
        {pending ? "로그인 중…" : "로그인 하기"}
      </button>

      <Link
        href="/signup"
        className="mx-auto mt-[22px] flex h-[59px] w-full max-w-[264px] items-center justify-center border border-[#7F7E7C] text-[15px] font-normal tracking-[-0.2px] text-[#7F7E7C] transition-colors hover:border-black hover:text-black"
      >
        이메일로 가입하기
      </Link>

      {/* 소셜 로그인: 카카오만 둔다 */}
      <KakaoLoginButton onClick={handleKakao} className="mt-[22px]" />

      {status.kind !== "idle" ? (
        <p
          role="status"
          aria-live="polite"
          className={
            status.kind === "error"
              ? "mt-6 text-center text-[13px] text-brand-primary"
              : "mt-6 text-center text-[13px] text-[#2DB400]"
          }
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}

