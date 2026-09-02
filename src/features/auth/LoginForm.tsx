"use client";

import Link from "next/link";
import { useState } from "react";

import { KakaoIcon } from "@/components/ui/icons";

type Status =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

/**
 * 로그인 폼.
 *
 * 실 API 가 없으므로 mock 처리:
 * - 두 필드가 모두 채워지면 성공, 아니면 에러 메시지 표시.
 * - 소셜 로그인 버튼은 준비 중 문구를 노출.
 * 실 API 연동 시 `submitLogin(id, password)` 호출로 교체하고, 성공 시 라우터 push.
 *
 * 상태 관리:
 * - 폼 필드 2개는 controlled input (`useState`).
 * - 서버 액션이 붙기 전까지 페이지 이동/토큰 저장은 하지 않는다.
 */
export function LoginForm() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id.trim() || !password) {
      setStatus({ kind: "error", message: "아이디와 비밀번호를 모두 입력해 주세요." });
      return;
    }
    // TODO: 실제 API 로 교체
    setStatus({
      kind: "success",
      message: "로그인 요청을 전송했습니다. (mock 응답)",
    });
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
        className="mx-auto mt-[55px] h-[59px] w-full max-w-[264px] border border-black text-[15px] font-normal tracking-[-0.2px] text-black transition-colors hover:bg-black hover:text-white"
      >
        로그인 하기
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

// ────────────────────────────────────────────────────────────────

type FieldProps = {
  label: string;
  id: string;
  type: "text" | "password";
  autoComplete: string;
  value: string;
  onChange: (next: string) => void;
  className?: string;
};

function Field({
  label,
  id,
  type,
  autoComplete,
  value,
  onChange,
  className = "",
}: FieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-[15px] font-normal leading-[15px] tracking-[-0.2px] text-black"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-[15px] block h-[49px] w-full border border-black bg-transparent px-3 text-[15px] tracking-[-0.2px] text-black outline-none focus:border-brand-primary"
      />
    </div>
  );
}
