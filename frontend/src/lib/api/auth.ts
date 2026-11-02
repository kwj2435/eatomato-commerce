import type { AuthSession } from "@/types/auth";

import { apiFetch } from "./client";

/** 로그인. `loginId` 에는 아이디 또는 이메일을 넣는다. */
export async function login(loginId: string, password: string): Promise<AuthSession> {
  return apiFetch<AuthSession>("/api/auth/login", {
    method: "POST",
    json: { loginId, password },
  });
}
