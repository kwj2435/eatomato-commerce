import type { Member } from "./member";

/** 로그인·가입 응답. */
export type AuthSession = {
  accessToken: string;
  tokenType: "Bearer";
  /** 토큰 유효 시간(초). */
  expiresIn: number;
  member: Member;
};
