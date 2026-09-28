"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signup } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/client";
import { startKakaoLogin } from "@/lib/api/kakao";
import { useAuthStore } from "@/lib/store/auth-store";

import { AuthField } from "./AuthField";
import { KakaoLoginButton } from "./KakaoLoginButton";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 회원가입 폼. 이메일 가입과 카카오 로그인(처음이면 자동 가입) 두 가지만 둔다.
 *
 * 시안에 가입 화면이 없어 로그인 폼과 같은 스타일로 최소 항목(이메일·비밀번호·이름)만 받는다.
 * 로그인은 이메일로 하고, 회원 정보의 아이디는 서버가 이메일 앞부분으로 만든다.
 * 나머지 회원 정보(휴대폰·주소 등)는 마이페이지에서 채운다.
 * 가입에 성공하면 서버가 바로 로그인 토큰을 주므로 마이페이지로 이동한다.
 */
export function SignupForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!EMAIL_PATTERN.test(email.trim())) return "이메일 형식을 확인해 주세요.";
    if (password.length < 8) return "비밀번호는 8자 이상 입력해 주세요.";
    if (password !== passwordConfirm) return "비밀번호가 일치하지 않습니다.";
    if (!name.trim()) return "이름을 입력해 주세요.";
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    try {
      setSession(
        await signup({ password, name: name.trim(), email: email.trim() }),
      );
      router.replace("/mypage");
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto flex w-full max-w-[446px] flex-col bg-surface-util px-4 py-6 md:px-3.5 md:py-2.5"
    >
      <AuthField
        label="이메일"
        id="signup-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
      />
      <AuthField
        label="비밀번호 (8자 이상)"
        id="signup-pw"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        className="mt-[25px]"
      />
      <AuthField
        label="비밀번호 확인"
        id="signup-pw-confirm"
        type="password"
        autoComplete="new-password"
        value={passwordConfirm}
        onChange={setPasswordConfirm}
        className="mt-[25px]"
      />
      <AuthField
        label="이름"
        id="signup-name"
        type="text"
        autoComplete="name"
        value={name}
        onChange={setName}
        className="mt-[25px]"
        inputProps={{ maxLength: 50 }}
      />

      <button
        type="submit"
        disabled={pending}
        className="mx-auto mt-[55px] h-[59px] w-full max-w-[264px] border border-black text-[15px] font-normal tracking-[-0.2px] text-black transition-colors hover:bg-black hover:text-white disabled:opacity-50"
      >
        {pending ? "가입 중…" : "이메일로 가입하기"}
      </button>

      <KakaoLoginButton onClick={() => startKakaoLogin("/mypage")} className="mt-[22px]" />

      <Link
        href="/login"
        className="mx-auto mt-[22px] text-[15px] font-normal tracking-[-0.2px] text-[#7F7E7C] underline-offset-2 hover:text-black hover:underline"
      >
        이미 회원이신가요? 로그인
      </Link>

      {error ? (
        <p role="alert" className="mt-6 text-center text-[13px] text-brand-primary">
          {error}
        </p>
      ) : null}
    </form>
  );
}
