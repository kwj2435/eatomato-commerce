import type {
  MarketingChannel,
  Member,
  MemberAddress,
  MemberBirthDate,
  MemberGender,
  MemberPhone,
} from "@/types/member";

import { apiFetch } from "./client";

/** 로그인한 회원의 정보. */
export async function getMyMember(): Promise<Member> {
  return apiFetch<Member>("/api/me", { auth: true });
}

/** 회원 정보 수정 요청. 넘기지 않은 필드는 서버가 그대로 둔다. 아이디·등급은 바꿀 수 없다. */
export type MemberPatch = {
  email?: string;
  name?: string;
  phone?: MemberPhone;
  address?: MemberAddress;
  birthDate?: MemberBirthDate;
  gender?: MemberGender;
  marketingChannels?: MarketingChannel[];
};

export async function updateMyMember(patch: MemberPatch): Promise<Member> {
  return apiFetch<Member>("/api/me", { method: "PATCH", auth: true, json: patch });
}
