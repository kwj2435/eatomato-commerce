import { MOCK_MEMBER } from "@/lib/mock/member";
import type { Member } from "@/types/member";

/**
 * 로그인한 회원의 정보를 조회한다.
 *
 * 현재는 mock 을 그대로 돌려주지만, 실 API 가 붙으면 세션 쿠키로 `/api/me` 를 호출하는
 * 형태가 된다. 호출부(마이페이지 서버 컴포넌트)가 이미 await 하고 있으므로
 * 이 함수 본문만 교체하면 된다.
 */
export async function getMyMember(): Promise<Member> {
  return MOCK_MEMBER;
}

/**
 * 회원 정보 변경 저장.
 *
 * 실 API 연동 시 PATCH 요청으로 교체하고, 서버 액션으로 감싸면
 * 폼에서 `useActionState` 로 대기/에러 상태를 그대로 받을 수 있다.
 */
export async function updateMyMember(
  patch: Partial<Member>,
): Promise<{ ok: true; member: Member }> {
  return { ok: true, member: { ...MOCK_MEMBER, ...patch } };
}
