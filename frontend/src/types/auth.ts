import type { Member } from "./member";

/** 로그인·가입·토큰 갱신 응답. */
export type AuthSession = {
  accessToken: string;
  tokenType: "Bearer";
  /** 액세스 토큰 유효 시간(초). 짧다(30분). */
  expiresIn: number;
  /** 액세스 토큰이 만료되면 새 토큰을 받는 데 쓴다. 한 번 쓰면 새 값으로 바뀐다. */
  refreshToken: string;
  /** 리프레시 토큰 유효 시간(초). 이 기간 안에 한 번이라도 쓰면 로그인이 계속 이어진다. */
  refreshExpiresIn: number;
  member: Member;
};
