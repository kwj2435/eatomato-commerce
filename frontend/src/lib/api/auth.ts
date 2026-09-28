import type { AuthSession } from "@/types/auth";

import { apiFetch } from "./client";

/** 로그인. `loginId` 에는 아이디 또는 이메일을 넣는다. */
export async function login(loginId: string, password: string): Promise<AuthSession> {
  return apiFetch<AuthSession>("/api/auth/login", {
    method: "POST",
    json: { loginId, password },
  });
}

export type SignupInput = {
  /** 비우면 서버가 이메일 앞부분으로 만든다. */
  loginId?: string;
  password: string;
  email: string;
  name: string;
};

/** 이메일 가입. 성공하면 바로 로그인된 세션을 돌려준다. */
export async function signup(input: SignupInput): Promise<AuthSession> {
  return apiFetch<AuthSession>("/api/auth/signup", { method: "POST", json: input });
}
