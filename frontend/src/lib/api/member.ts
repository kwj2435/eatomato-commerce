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
  nickname?: string;
  phone?: MemberPhone;
  address?: MemberAddress;
  birthDate?: MemberBirthDate;
  gender?: MemberGender;
  marketingChannels?: MarketingChannel[];
};

/** 가입 후 추가 정보(닉네임·기본 배송지). */
export type ProfileInput = {
  nickname: string;
  zipCode: string;
  roadAddress: string;
  detailAddress: string;
};

export async function completeProfile(input: ProfileInput): Promise<Member> {
  return apiFetch<Member>("/api/me/profile", { method: "PUT", auth: true, json: input });
}

export async function updateMyMember(patch: MemberPatch): Promise<Member> {
  return apiFetch<Member>("/api/me", { method: "PATCH", auth: true, json: patch });
}
