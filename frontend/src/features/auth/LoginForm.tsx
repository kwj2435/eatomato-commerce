"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { KakaoIcon } from "@/components/ui/icons";
import { AuthField as Field } from "./AuthField";
import { login } from "@/lib/api/auth";
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
 * - 성공하면 `?next=` 로 넘어온 화면(없으면 마이페이지)으로 이동한다.
 * - 소셜 로그인 버튼은 준비 중 문구를 노출.
 */
export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id.trim() || !password) {
      setStatus({ kind: "error", message: "아이디와 비밀번호를 모두 입력해 주세요." });
      return;
    }
    setPending(true);
    try {
      setSession(await login(id.trim(), password));
      router.replace(nextPath());
    } catch (error) {
      setStatus({ kind: "error", message: errorMessage(error) });
      setPending(false);
    }
  };

  const notifyComingSoon = (provider: "카카오" | "네이버") => {
    setStatus({
      kind: "error",
      message: `${provider} 로그인은 준비 중입니다.`,
    });
  };

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
        간편하게 가입하기
      </Link>

      {/* 소셜 로그인 */}
      <button
        type="button"
        onClick={() => notifyComingSoon("카카오")}
        className="mx-auto mt-[22px] flex h-12 w-full max-w-[264px] items-center gap-3.5 bg-[#FEE500] px-[18px] text-[15px] font-normal tracking-[-0.2px] text-black transition-opacity hover:opacity-90"
      >
        <span className="flex w-[22px] flex-none items-center justify-center text-black">
          <KakaoIcon />
        </span>
        <span className="flex-1 text-center">카카오로 시작하기</span>
      </button>

      <button
        type="button"
        onClick={() => notifyComingSoon("네이버")}
        className="mx-auto mt-[23px] flex h-12 w-full max-w-[264px] items-center gap-3.5 bg-[#03C75A] px-[18px] text-[15px] font-normal tracking-[-0.2px] text-white transition-opacity hover:opacity-90"
      >
        <span className="flex h-[22px] w-[22px] flex-none items-center justify-center bg-white text-[14px] font-bold text-[#03C75A]">
          N
        </span>
        <span className="flex-1 text-center">네이버로 로그인하기</span>
      </button>

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

/**
 * 로그인 후 이동할 경로. `?next=` 는 같은 사이트 경로(`/...`)만 받아 외부 주소로 튕겨 나가지 않게 한다.
 * `useSearchParams` 대신 제출 시점에 직접 읽어 정적 export 에서 Suspense 경계가 필요 없게 했다.
 */
function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/mypage";
}
