"use client";

import Link from "next/link";
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
 * 가입 후 추가 정보: 닉네임·기본 배송지 주소와 약관 필수 동의. 카카오·네이버 가입 모두 여기를 거친다.
 * 다 넣기 전에는 ProfileGate 가 다른 화면에서도 이리로 돌려보낸다(관리자 제외).
 * 약관 동의가 생기기 전에 가입한 회원도 다음 로그인 때 여기서 동의를 받는다(저장된 닉네임·주소는 채워 둔다).
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
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [ageOver14, setAgeOver14] = useState(false);
  const allAgreed = agreeTerms && agreePrivacy && ageOver14;
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

  const toggleAll = () => {
    const next = !allAgreed;
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgeOver14(next);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!NICKNAME_PATTERN.test(nickname.trim())) return setError("닉네임은 한글·영문·숫자·밑줄(_) 2~12자로 입력해 주세요.");
    if (!zipCode || !roadAddress) return setError("주소 검색으로 주소를 입력해 주세요.");
    if (!allAgreed) return setError("필수 약관에 모두 동의해 주세요.");
    setPending(true);
    setError(null);
    try {
      setMember(
        await completeProfile({
          nickname: nickname.trim(),
          zipCode,
          roadAddress,
          detailAddress: detailAddress.trim(),
          agreeTerms,
          agreePrivacy,
          ageOver14,
        }),
      );
      router.replace(nextPathFromLocation());
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto flex w-full max-w-[446px] flex-col px-4 py-6 md:px-3.5 md:py-2.5">
      <h1 className="text-[18px] font-medium tracking-[-0.3px] text-black">추가 정보 입력</h1>
      <p className="mt-2 text-[14px] leading-[21px] text-ink-muted">
        서비스 이용을 위해 닉네임과 기본 배송지를 입력하고 약관에 동의해 주세요. 닉네임은 후기 작성자로 표시됩니다.
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

      <fieldset className="mt-[35px] border-t border-black pt-5">
        <legend className="sr-only">약관 동의</legend>
        <label className="flex cursor-pointer items-center gap-2.5 text-[15px] font-medium text-black">
          <input type="checkbox" checked={allAgreed} onChange={toggleAll} className="h-[18px] w-[18px] accent-black" />
          전체 동의
        </label>
        <div className="mt-4 flex flex-col gap-3">
          <ConsentRow checked={agreeTerms} onChange={setAgreeTerms} label="[필수] 이용약관 동의" href="/terms/" />
          <ConsentRow checked={agreePrivacy} onChange={setAgreePrivacy} label="[필수] 개인정보 수집·이용 동의" href="/privacy/" />
          <ConsentRow checked={ageOver14} onChange={setAgeOver14} label="[필수] 만 14세 이상입니다" />
        </div>
      </fieldset>

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

/** 약관 동의 한 줄. 문서가 있으면 오른쪽에 새 창으로 여는 '보기' 링크를 붙인다. */
function ConsentRow({
  checked,
  onChange,
  label,
  href,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[14px] text-ink-body">
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-[18px] w-[18px] accent-black"
        />
        {label}
      </label>
      {href ? (
        <Link href={href} target="_blank" rel="noopener" className="flex-none text-[13px] text-ink-muted underline underline-offset-2">
          보기
        </Link>
      ) : null}
    </div>
  );
}
