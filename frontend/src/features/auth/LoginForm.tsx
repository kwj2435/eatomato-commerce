"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { KakaoLoginButton } from "./KakaoLoginButton";
import { NaverLoginButton } from "./NaverLoginButton";
import { login } from "@/lib/api/auth";
import { useRedirectIfLoggedIn } from "@/lib/store/use-redirect-if-logged-in";
import { afterLoginPath, nextPathFromLocation } from "@/lib/utils/next-path";
import { startKakaoLogin } from "@/lib/api/kakao";
import { startNaverLogin } from "@/lib/api/naver";
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
 * - 새 가입은 카카오·네이버로만 받는다(처음이면 자동 가입). 기존 회원은 아이디·이메일과 비밀번호로도 로그인한다.
 */
export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
  const handleNaver = () => startNaverLogin(nextPathFromLocation());

  if (redirecting) return <p className="py-20 text-center text-[14px] text-ink-muted">이미 로그인되어 있습니다. 이동 중…</p>;

  return (
    <div className="mx-auto w-full max-w-[510px] px-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col rounded-[24px] border border-[#F3DEDE] bg-[#FFFAFA] px-6 py-10 md:px-[51px] md:pb-[46px] md:pt-[60px]"
      >
        <h1 className="text-center font-sans text-[30px] font-bold leading-tight tracking-[-0.5px] text-brand-secondary md:text-[36px]">
          Hello, tomato
        </h1>
        <p className="mt-2 text-center text-[14px] tracking-[-0.2px] text-[#6B6461]">
          오늘도 작은 토마토가 기다리고 있어요.
        </p>

        <LoginInput
          label="아이디 또는 이메일"
          id="login-id"
          type="text"
          autoComplete="username"
          placeholder="eatomato@example.com"
          value={id}
          onChange={setId}
          className="mt-[30px]"
        />

        <LoginInput
          label="비밀번호"
          id="login-pw"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          className="mt-[18px]"
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              aria-pressed={showPassword}
              className="flex h-full items-center px-4 text-[#8A7F7C] hover:text-brand-secondary"
            >
              <EyeIcon off={showPassword} />
            </button>
          }
        />

        <div className="mt-[18px] flex justify-end">
          <Link
            href="/forgot-password"
            className="text-[14px] tracking-[-0.2px] text-[#5E5552] underline-offset-2 hover:underline"
          >
            비밀번호 찾기
          </Link>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-6 h-[62px] w-full rounded-[10px] bg-[#B2361B] text-[16px] font-semibold tracking-[-0.2px] text-white transition-colors hover:bg-brand-secondary disabled:opacity-50"
        >
          {pending ? "로그인 중…" : "로그인"}
        </button>

        {status.kind !== "idle" ? (
          <p
            role="status"
            aria-live="polite"
            className={
              status.kind === "error"
                ? "mt-4 text-center text-[13px] text-brand-primary"
                : "mt-4 text-center text-[13px] text-[#2DB400]"
            }
          >
            {status.message}
          </p>
        ) : null}

        <div className="my-[30px] flex items-center gap-4 text-[12px] text-[#A39793]" aria-hidden>
          <span className="h-px flex-1 bg-[#E6D9D7]" />
          또는
          <span className="h-px flex-1 bg-[#E6D9D7]" />
        </div>

        {/* 소셜 로그인. 처음이면 자동으로 가입된다(이메일 가입은 받지 않는다). */}
        <KakaoLoginButton onClick={handleKakao} wide />
        <NaverLoginButton onClick={handleNaver} className="mt-3" />

        <p className="mt-8 break-keep text-center text-[14px] tracking-[-0.2px] text-[#5E5552]">
          처음이면 카카오·네이버로 바로 가입돼요.
        </p>
        <Link
          href="/orders/guest"
          className="mx-auto mt-3 text-[14px] tracking-[-0.2px] text-[#5E5552] underline underline-offset-4 hover:text-brand-secondary"
        >
          비회원 주문 조회
        </Link>
      </form>
    </div>
  );
}

/** 로그인 카드 전용 입력 필드(둥근 흰 칸, 포커스 시 붉은 테두리 + 옅은 링). */
function LoginInput({
  label,
  id,
  type,
  autoComplete,
  placeholder,
  value,
  onChange,
  className = "",
  trailing,
}: {
  label: string;
  id: string;
  type: "text" | "password";
  autoComplete: string;
  placeholder?: string;
  value: string;
  onChange: (next: string) => void;
  className?: string;
  /** 입력칸 오른쪽 끝에 붙는 요소(비밀번호 보기 버튼). */
  trailing?: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[13px] font-semibold tracking-[-0.2px] text-brand-secondary">
        {label}
      </label>
      <div className="mt-2 flex h-[60px] items-center rounded-[10px] border border-[#E8D3D1] bg-white transition-shadow focus-within:border-brand-primary focus-within:ring-4 focus-within:ring-[#F6D9D2]">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-full min-w-0 flex-1 rounded-[10px] bg-transparent px-5 text-[16px] tracking-[-0.2px] text-ink-body outline-none placeholder:text-[#B5ABA8]"
        />
        {trailing}
      </div>
    </div>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off ? <path d="M4 4l16 16" /> : null}
    </svg>
  );
}
