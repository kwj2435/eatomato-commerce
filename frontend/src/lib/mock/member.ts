import type { Member } from "@/types/member";

/**
 * 마이페이지 회원 정보 시딩 데이터.
 *
 * 실서비스에서는 세션에서 회원을 조회하므로 이 파일은 사라진다.
 *
 * 값에 대한 참고:
 * 시안(publish/mypage.html)은 참고 사이트의 실제 계정 화면을 캡처한 것이라
 * 아이디/이메일/휴대폰/주소가 실존 개인정보로 보인다. 저장소에 그대로 남기지 않기 위해
 * **자릿수와 형식만 시안과 동일하게 맞춘 가상의 값**으로 대체했다.
 * (등급 라벨 "Membership Benefit" 처럼 개인정보가 아닌 값은 시안 그대로 유지)
 */
export const MOCK_MEMBER: Member = {
  id: "eatomato01",
  email: "eatomato01@example.com",
  name: "김토마",
  grade: "Membership Benefit",
  phone: { first: "010", middle: "0000", last: "0000" },
  address: {
    zipCode: "21986",
    road: "인천 연수구 송도문화로28번길 28 (송도동, 송도글로벌캠퍼스푸르지오)",
    detail: "오피스텔 202동 3109호",
  },
  birthDate: { year: 1995, month: 10, day: 27 },
  gender: "female",
  marketingChannels: ["email", "sms"],
};
