"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { searchPostcode } from "@/components/address/postcode";
import { errorMessage } from "@/lib/api/client";
import { completeProfile } from "@/lib/api/member";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRequireAuth } from "@/lib/store/use-require-auth";
import { nextPathFromLocation } from "@/lib/utils/next-path";
import type { Member } from "@/types/member";

const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9_]{2,12}$/;

/**
 * 가입 후 추가 정보: 닉네임·기본 배송지 주소. 이메일·카카오 가입 모두 여기를 거친다.
 * 다 넣기 전에는 ProfileGate 가 다른 화면에서도 이리로 돌려보낸다(관리자 제외).
 */
export function ProfileForm() {
  const ready = useRequireAuth();
  const router = useRouter();
  const member = useAuthStore((s) => s.member);

  // 이미 다 넣은 회원이면 바로 넘긴다.
  useEffect(() => {
    if (member?.profileComplete) router.replace(nextPathFromLocation());
  }, [member, router]);

  if (!ready || !member || member.profileComplete) {
    return <div className="mx-auto h-[420px] max-w-[446px] animate-pulse bg-black/[0.04]" />;
  }
  // 회원 정보가 준비된 뒤에 폼을 그려, 저장된 값을 초기값으로 쓴다.
  return <ProfileFields member={member} />;
}

function ProfileFields({ member }: { member: Member }) {
  const router = useRouter();
  const setMember = useAuthStore((s) => s.setMember);
  const [nickname, setNickname] = useState(member.nickname ?? "");
  const [zipCode, setZipCode] = useState(member.address.zipCode);
  const [roadAddress, setRoadAddress] = useState(member.address.road);
  const [detailAddress, setDetailAddress] = useState(member.address.detail);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findAddress = async () => {
    try {
      const found = await searchPostcode();
      if (found) {
        setZipCode(found.zipCode);
        setRoadAddress(found.roadAddress);
      }
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!NICKNAME_PATTERN.test(nickname.trim())) return setError("닉네임은 한글·영문·숫자·밑줄(_) 2~12자로 입력해 주세요.");
    if (!zipCode || !roadAddress) return setError("주소 검색으로 주소를 입력해 주세요.");
    setPending(true);
    setError(null);
    try {
      setMember(await completeProfile({ nickname: nickname.trim(), zipCode, roadAddress, detailAddress: detailAddress.trim() }));
      router.replace(nextPathFromLocation());
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto flex w-full max-w-[446px] flex-col bg-surface-util px-4 py-6 md:px-3.5 md:py-2.5">
      <h1 className="text-[18px] font-medium tracking-[-0.3px] text-black">추가 정보 입력</h1>
      <p className="mt-2 text-[14px] leading-[21px] text-ink-muted">
        서비스 이용을 위해 닉네임과 기본 배송지를 입력해 주세요. 닉네임은 후기 작성자로 표시됩니다.
      </p>

      <label htmlFor="pf-nickname" className="mt-7 block text-[15px] text-black">
        닉네임 (한글·영문·숫자 2~12자)
      </label>
      <input
        id="pf-nickname"
        value={nickname}
        maxLength={12}
        onChange={(e) => setNickname(e.target.value)}
        className="mt-[15px] block h-[49px] w-full border border-black bg-transparent px-3 text-[15px] outline-none focus:border-brand-primary"
      />

      <span className="mt-[25px] block text-[15px] text-black">주소</span>
      <div className="mt-[15px] flex gap-2">
        <input
          value={zipCode}
          readOnly
          placeholder="우편번호"
          aria-label="우편번호"
          className="h-[49px] w-32 border border-black bg-black/[0.03] px-3 text-[15px]"
        />
        <button type="button" onClick={findAddress} className="h-[49px] flex-1 border border-black text-[15px] hover:bg-black hover:text-white">
          주소 검색
        </button>
      </div>
      <input
        value={roadAddress}
        readOnly
        placeholder="주소 검색을 눌러 주세요"
        aria-label="기본 주소"
        className="mt-2 h-[49px] w-full border border-black bg-black/[0.03] px-3 text-[15px]"
      />
      <input
        value={detailAddress}
        onChange={(e) => setDetailAddress(e.target.value)}
        placeholder="상세 주소 (동·호수 등)"
        aria-label="상세 주소"
        maxLength={200}
        className="mt-2 h-[49px] w-full border border-black bg-transparent px-3 text-[15px] outline-none focus:border-brand-primary"
      />

      <button
        type="submit"
        disabled={pending}
        className="mx-auto mt-[45px] h-[59px] w-full max-w-[264px] border border-black text-[15px] transition-colors hover:bg-black hover:text-white disabled:opacity-50"
      >
        {pending ? "저장 중…" : "저장하고 시작하기"}
      </button>

      {error ? (
        <p role="alert" className="mt-6 text-center text-[13px] text-brand-primary">
          {error}
        </p>
      ) : null}
    </form>
  );
}
