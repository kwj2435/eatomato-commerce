/**
 * 회원 정보.
 *
 * 시안(publish/mypage.html 7p)의 "회원 정보" 폼 필드를 그대로 모델링한다.
 * - 아이디/등급/우편번호/기본주소는 시안에서 readonly 로 잠겨 있다(서버가 관리).
 * - 휴대폰·생년월일은 시안이 입력을 나눠 받으므로 문자열 한 덩어리가 아니라
 *   분할된 형태로 들고 있다가 전송 직전에 합치는 편이 폼 상태를 다루기 쉽다.
 */
export type Member = {
  /** 로그인 아이디. 변경 불가. */
  id: string;
  email: string;
  name: string;
  /** 회원 등급 라벨. 서버 산출값이라 변경 불가. */
  grade: string;
  phone: MemberPhone;
  address: MemberAddress;
  /** 미입력 회원이 있을 수 있어 null 을 허용한다. */
  birthDate: MemberBirthDate | null;
  gender: MemberGender | null;
  /** 수신 동의한 마케팅 채널. 미동의는 빈 배열. */
  marketingChannels: MarketingChannel[];
};

/** 휴대폰 번호 3분할(시안의 `010 - 0000 - 0000` 입력). */
export type MemberPhone = {
  first: string;
  middle: string;
  last: string;
};

export type MemberAddress = {
  /** 우편번호. 주소 검색으로만 채워지므로 직접 입력은 막는다. */
  zipCode: string;
  /** 도로명 기본 주소. 우편번호와 함께 검색 결과로 채워진다. */
  road: string;
  /** 상세 주소. 회원이 직접 입력. */
  detail: string;
};

export type MemberBirthDate = {
  year: number;
  month: number;
  day: number;
};

export type MemberGender = "male" | "female";

export type MarketingChannel = "email" | "sms";

/** 성별 라디오 옵션. 시안 순서(남자 → 여자)를 유지한다. */
export const GENDER_OPTIONS: ReadonlyArray<{
  value: MemberGender;
  label: string;
}> = [
  { value: "male", label: "남자" },
  { value: "female", label: "여자" },
];

/** 마케팅 수신 동의 체크박스 옵션. */
export const MARKETING_CHANNEL_OPTIONS: ReadonlyArray<{
  value: MarketingChannel;
  label: string;
}> = [
  { value: "email", label: "이메일" },
  { value: "sms", label: "문자 메시지" },
];
