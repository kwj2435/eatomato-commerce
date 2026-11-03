"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

import { ChevronDownIcon } from "@/components/ui/icons";
import { searchPostcode } from "@/components/address/postcode";
import { errorMessage } from "@/lib/api/client";
import { updateMyMember } from "@/lib/api/member";
import { logout, useAuthStore } from "@/lib/store/auth-store";
import { cn } from "@/lib/utils/cn";

import { LoginProviderBadge } from "./LoginProviderBadge";
import { markProfileSaved } from "./profile-saved";
import {
  GENDER_OPTIONS,
  MARKETING_CHANNEL_OPTIONS,
  type MarketingChannel,
  type Member,
  type MemberGender,
  type MemberPhone,
} from "@/types/member";

type Status =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

/** 생년 선택 범위. 현재 연도부터 100년 전까지. */
const BIRTH_YEAR_SPAN = 100;

type MemberInfoFormProps = {
  member: Member;
};

/**
 * 회원 정보 수정 폼(/mypage/profile).
 *
 * - 맨 위: 마이페이지로 돌아가는 머리줄. 저장하지 않은 변경이 있으면 나가기 전에 한 번 묻는다(탭 닫기·새로고침 포함).
 * - "로그인" 칸: 회원이 정한 적 없는 자동 아이디 대신 연결된 소셜 로그인(네이버·카카오)을 잠가서 보여 준다.
 *   소셜 계정이 아니면(관리자 등) 아이디를 보여 준다. 등급은 마이페이지 맨 위 요약에 있다.
 * - 저장하면 마이페이지로 돌아가 "저장했습니다" 를 보여 준다. 로그아웃·회원 탈퇴는 저장 버튼 아래.
 *
 * 상태 관리:
 * - 서버에서 받은 `member` 를 초기값으로 삼는 controlled input 묶음이다.
 * - 우편번호·기본주소는 주소 검색으로만 바뀐다(직접 입력은 막는다).
 *
 * 저장은 `PATCH /api/me`, 로그아웃은 서버에서 리프레시 토큰을 폐기하고 메인으로 보낸다.
 * 주소는 우편번호 검색(카카오 우편번호 서비스)으로 채운다.
 */
export function MemberInfoForm({ member }: MemberInfoFormProps) {
  const fieldId = useId();
  const id = (name: string) => `${fieldId}-${name}`;

  const [email, setEmail] = useState(member.email);
  const [name, setName] = useState(member.name);
  const [phone, setPhone] = useState(member.phone);
  const [nickname, setNickname] = useState(member.nickname ?? "");
  const [zipCode, setZipCode] = useState(member.address.zipCode);
  const [roadAddress, setRoadAddress] = useState(member.address.road);
  const [addressDetail, setAddressDetail] = useState(member.address.detail);
  const [birthYear, setBirthYear] = useState(member.birthDate?.year ?? null);
  const [birthMonth, setBirthMonth] = useState(member.birthDate?.month ?? null);
  const [birthDay, setBirthDay] = useState(member.birthDate?.day ?? null);
  const [gender, setGender] = useState<MemberGender | null>(member.gender);
  const [marketing, setMarketing] = useState<MarketingChannel[]>(
    member.marketingChannels,
  );
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, setPending] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const setMember = useAuthStore((s) => s.setMember);
  const router = useRouter();

  const snapshot = JSON.stringify([email, name, phone, nickname, zipCode, roadAddress, addressDetail, birthYear, birthMonth, birthDay, gender, [...marketing].sort()]);
  const [initialSnapshot] = useState(snapshot);
  const dirty = snapshot !== initialSnapshot && !leaving;

  // 저장하지 않고 탭을 닫거나 새로고침하면 브라우저가 한 번 묻는다.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const confirmLeave = (e: React.MouseEvent) => {
    if (dirty && !window.confirm("저장하지 않은 변경 사항이 있어요. 저장하지 않고 나갈까요?")) e.preventDefault();
  };

  const yearOptions = useMemo(() => {
    const thisYear = new Date().getFullYear();
    return Array.from({ length: BIRTH_YEAR_SPAN }, (_, i) => thisYear - i);
  }, []);

  /**
   * 선택한 연/월의 실제 일수만 노출한다(2월 28/29일, 30일 달 구분).
   * 연·월 중 하나라도 비어 있으면 최대치인 31일을 보여준다.
   */
  const dayOptions = useMemo(() => {
    const lastDay =
      birthYear && birthMonth
        ? new Date(birthYear, birthMonth, 0).getDate()
        : 31;
    return Array.from({ length: lastDay }, (_, i) => i + 1);
  }, [birthYear, birthMonth]);

  /** 연·월이 바뀌어 존재하지 않는 날짜가 되면(예: 3/31 → 2월) 일 선택을 비운다. */
  const syncDay = (nextYear: number | null, nextMonth: number | null) => {
    if (!birthDay || !nextYear || !nextMonth) return;
    if (birthDay > new Date(nextYear, nextMonth, 0).getDate()) setBirthDay(null);
  };

  const setPhonePart = (part: keyof MemberPhone, value: string) => {
    // 숫자만 허용. 붙여넣기로 들어온 하이픈/공백을 제거한다.
    setPhone((prev) => ({ ...prev, [part]: value.replace(/\D/g, "") }));
  };

  const toggleMarketing = (channel: MarketingChannel) => {
    setMarketing((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel],
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setStatus({ kind: "error", message: "이름을 입력해 주세요." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus({ kind: "error", message: "이메일 형식을 확인해 주세요." });
      return;
    }
    if (`${phone.first}${phone.middle}${phone.last}`.length < 10) {
      setStatus({ kind: "error", message: "휴대폰 번호를 모두 입력해 주세요." });
      return;
    }

    setPending(true);
    try {
      const updated = await updateMyMember({
        email: email.trim(),
        name: name.trim(),
        phone,
        nickname: nickname.trim() || undefined,
        address: { zipCode, road: roadAddress, detail: addressDetail },
        // 연·월·일을 모두 골랐을 때만 보낸다. 서버는 넘기지 않은 필드를 그대로 둔다.
        birthDate:
          birthYear && birthMonth && birthDay
            ? { year: birthYear, month: birthMonth, day: birthDay }
            : undefined,
        gender: gender ?? undefined,
        marketingChannels: marketing,
      });
      setMember(updated);
      setLeaving(true);
      markProfileSaved();
      router.push("/mypage");
    } catch (error) {
      setStatus({ kind: "error", message: errorMessage(error) });
    } finally {
      setPending(false);
    }
  };

  const handleLogout = () => {
    if (dirty && !window.confirm("저장하지 않은 변경 사항이 있어요. 저장하지 않고 로그아웃할까요?")) return;
    setLeaving(true);
    logout();
    router.push("/");
  };

  return (
    <>
      <div className="-mx-5 flex h-[50px] items-center gap-1 border-b border-[#E3D6D3] px-3 md:mx-0 md:h-auto md:border-0 md:px-0 md:pb-2">
        <Link href="/mypage" onClick={confirmLeave} aria-label="마이페이지로 돌아가기" className="-ml-1 p-1.5 text-black hover:opacity-70">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-[16px] font-bold tracking-[-0.3px] text-black md:text-[22px]">회원 정보 수정</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="pt-1 md:pt-2">
        {member.loginProvider ? (
          <div className="mt-4">
            <p className={fieldLabelClass}>로그인</p>
            <div className={cn(readonlyInputClass, "mt-[9px] flex items-center justify-between gap-3")}>
              <LoginProviderBadge provider={member.loginProvider} suffix="로그인 중" />
              <span className="text-[11.5px] text-[#9C918E]">변경 불가</span>
            </div>
          </div>
        ) : (
          <Field label="아이디" htmlFor={id("id")}>
            <input id={id("id")} type="text" value={member.id} readOnly className={readonlyInputClass} />
          </Field>
        )}

        <Field label="이메일" htmlFor={id("email")}>
          <input
            id={id("email")}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
        <Field label="이름" htmlFor={id("name")}>
          <input
            id={id("name")}
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="닉네임" htmlFor={id("nickname")}>
          <input
            id={id("nickname")}
            type="text"
            maxLength={12}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className={inputClass}
          />
        </Field>
        </div>

        <Field label="휴대폰 번호" htmlFor={id("tel1")}>
          <input
            id={id("tel1")}
            type="text"
            inputMode="numeric"
            maxLength={3}
            aria-label="휴대폰 번호 앞자리"
            value={phone.first}
            onChange={(e) => setPhonePart("first", e.target.value)}
            className={cn(inputClass, "flex-1")}
          />
          <span className="w-5 flex-none text-center text-[13px] text-black">
            -
          </span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            aria-label="휴대폰 번호 가운데자리"
            value={phone.middle}
            onChange={(e) => setPhonePart("middle", e.target.value)}
            className={cn(inputClass, "flex-1")}
          />
          <span className="w-5 flex-none text-center text-[13px] text-black">
            -
          </span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            aria-label="휴대폰 번호 뒷자리"
            value={phone.last}
            onChange={(e) => setPhonePart("last", e.target.value)}
            className={cn(inputClass, "flex-1")}
          />
        </Field>

        <Field label="주소" htmlFor={id("zip")} rowClassName="flex items-center gap-2">
          <input
            id={id("zip")}
            type="text"
            value={zipCode}
            readOnly
            className={cn(readonlyInputClass, "flex-1")}
          />
          <button
            type="button"
            onClick={async () => {
              try {
                const found = await searchPostcode();
                if (found) {
                  setZipCode(found.zipCode);
                  setRoadAddress(found.roadAddress);
                }
              } catch (e) {
                setStatus({ kind: "error", message: errorMessage(e) });
              }
            }}
            className="h-[42px] w-[104px] flex-none border border-brand-deep bg-white text-[12px] font-bold tracking-[-0.2px] text-black transition-colors hover:bg-brand-deep hover:text-white"
          >
            주소 검색
          </button>
        </Field>

        {/* 주소만 입력 행이 둘(기본 주소 readonly + 상세 주소)이라 Field 대신 직접 구성한다. */}
        <div>
          <label htmlFor={id("addr")} className="sr-only">
            기본 주소
          </label>
          <div className="mt-2 flex items-center">
            <input
              id={id("addr")}
              type="text"
              value={roadAddress}
              readOnly
              className={readonlyInputClass}
            />
          </div>
          <div className="mt-2 flex items-center">
            <input
              type="text"
              autoComplete="address-line2"
              aria-label="상세 주소"
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/*
         * 생년월일은 커스텀 드롭다운(OptionSelect) 대신 네이티브 select 를 쓴다.
         * 항목이 100/12/31개로 많아 스크롤·키보드 타이핑 탐색·모바일 네이티브 피커가
         * 커스텀 리스트박스보다 확실히 낫기 때문이다. 시안도 화살표만 커스텀한 네이티브 select 다.
         */}
        <Field label="생년월일" htmlFor={id("year")} rowClassName="grid grid-cols-3 gap-2">
          <SelectBox>
            <select
              id={id("year")}
              aria-label="생년"
              value={birthYear ?? ""}
              onChange={(e) => {
                const next = e.target.value ? Number(e.target.value) : null;
                setBirthYear(next);
                syncDay(next, birthMonth);
              }}
              className={selectClass}
            >
              <option value="">연도</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
          </SelectBox>

          <SelectBox>
            <select
              aria-label="생월"
              value={birthMonth ?? ""}
              onChange={(e) => {
                const next = e.target.value ? Number(e.target.value) : null;
                setBirthMonth(next);
                syncDay(birthYear, next);
              }}
              className={selectClass}
            >
              <option value="">월</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {month}월
                </option>
              ))}
            </select>
          </SelectBox>

          <SelectBox>
            <select
              aria-label="생일"
              value={birthDay ?? ""}
              onChange={(e) =>
                setBirthDay(e.target.value ? Number(e.target.value) : null)
              }
              className={selectClass}
            >
              <option value="">일</option>
              {dayOptions.map((day) => (
                <option key={day} value={day}>
                  {day}일
                </option>
              ))}
            </select>
          </SelectBox>
        </Field>

        <ChoiceField label="성별">
          {GENDER_OPTIONS.map((option) => (
            <Choice
              key={option.value}
              type="radio"
              name={id("gender")}
              label={option.label}
              checked={gender === option.value}
              onChange={() => setGender(option.value)}
            />
          ))}
        </ChoiceField>

        <ChoiceField label="마케팅 정보 수신 동의">
          {MARKETING_CHANNEL_OPTIONS.map((option) => (
            <Choice
              key={option.value}
              type="checkbox"
              label={option.label}
              checked={marketing.includes(option.value)}
              onChange={() => toggleMarketing(option.value)}
            />
          ))}
        </ChoiceField>

        <div className="mt-7">
          <button
            type="submit"
            disabled={pending}
            className="h-[50px] w-full bg-brand-deep text-[14px] font-bold tracking-[-0.2px] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "저장 중…" : "변경 사항 저장하기"}
          </button>
        </div>

        {status.kind !== "idle" ? (
          <p
            role="status"
            aria-live="polite"
            className={cn(
              "mt-4 text-center text-[13px] tracking-[-0.2px]",
              status.kind === "error" ? "text-brand-primary" : "text-brand-deep",
            )}
          >
            {status.message}
          </p>
        ) : null}

        <div className="mt-7 flex items-center justify-center gap-5 border-t border-[#ECDEDB] pt-4 text-[13px] tracking-[-0.2px]">
          <button type="button" onClick={handleLogout} className="text-ink-muted hover:text-black hover:underline">
            로그아웃
          </button>
          <span aria-hidden className="h-3 w-px bg-[#D9CDCA]" />
          <Link href="/mypage/withdraw" onClick={confirmLeave} className={subLinkClass}>
            회원 탈퇴
          </Link>
        </div>
      </form>
    </>
  );
}

// ────────────────────────────────────────────────────────────────
// 시안 `.input` / `.select` / `.member__link` 규격. 여러 필드가 공유하므로 상수로 뺀다.

const inputBase = "h-[42px] w-full min-w-0 border px-3.5 text-[13px] tracking-[-0.2px] outline-none";

const inputClass = `${inputBase} border-brand-deep bg-white text-black placeholder:text-[#A6A2A7] focus:border-brand-secondary`;

/** 바꿀 수 없는 칸(로그인 방식·우편번호·기본 주소). 회색으로 수정 가능한 칸과 구분한다. */
const readonlyInputClass = `${inputBase} cursor-default border-[#E0D6D3] bg-[#F1EBE9] text-[#6B6361]`;

const selectClass =
  "h-[42px] w-full appearance-none border border-brand-deep bg-white pl-3 pr-7 text-[13px] tracking-[-0.2px] text-black outline-none focus:border-brand-secondary";

const fieldLabelClass =
  "block text-[12px] leading-[18px] tracking-[-0.2px] text-black";

const subLinkClass = "text-ink-subtle underline-offset-2 transition-colors hover:text-ink-muted hover:underline";

type FieldProps = {
  label: string;
  /** 라벨이 가리킬 첫 번째 입력의 id. */
  htmlFor: string;
  rowClassName?: string;
  children: React.ReactNode;
};

/** 라벨 + 입력 행(row) 한 벌. 시안의 `.field` 피치(라벨 18 / 간격 9 / 입력 42)를 그대로 쓴다. */
function Field({ label, htmlFor, rowClassName, children }: FieldProps) {
  return (
    <div className="mt-4">
      <label
        htmlFor={htmlFor}
        className={fieldLabelClass}
      >
        {label}
      </label>
      <div className={cn("mt-[9px]", rowClassName ?? "flex items-center")}>
        {children}
      </div>
    </div>
  );
}

/**
 * 라디오/체크박스 그룹 필드.
 * 개별 input 마다 라벨이 붙으므로 그룹 제목은 `label` 이 아닌 `fieldset/legend` 로 묶는다.
 */
function ChoiceField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="mt-4">
      <legend className={fieldLabelClass}>
        {label}
      </legend>
      <div className="mt-[9px] flex h-8 items-center gap-[31px]">{children}</div>
    </fieldset>
  );
}

/**
 * 라디오/체크박스 한 칸.
 *
 * 네이티브 input 을 유지한 채(그룹 키보드 탐색·폼 시맨틱을 그대로 얻는다)
 * `appearance-none` 위에 체크/도트를 CSS 로 그린다(브랜드 색. 시안 원본의 파란색은 쓰지 않는다).
 * components/ui/Checkbox 는 button 기반이라 라디오 그룹과 form 제출에 맞지 않아 재사용하지 않았다.
 */
function Choice({
  type,
  name,
  label,
  checked,
  onChange,
}: {
  type: "radio" | "checkbox";
  name?: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3.5">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className={cn(
          "relative h-[15px] w-[15px] flex-none appearance-none border border-[#A09A9A] bg-white outline-none",
          "before:absolute before:content-['']",
          "focus-visible:ring-2 focus-visible:ring-brand-deep/40",
          type === "radio"
            ? "rounded-full checked:border-2 checked:border-brand-deep checked:bg-white before:inset-[2px] before:rounded-full checked:before:bg-brand-deep"
            : "rounded-[2px] checked:border-brand-deep checked:bg-brand-deep before:left-[3px] before:top-[3px] before:h-[4px] before:w-[8px] before:-rotate-45 checked:before:border-b-[1.6px] checked:before:border-l-[1.6px] checked:before:border-white",
        )}
      />
      <span className="text-[13px] tracking-[-0.2px] text-black">{label}</span>
    </label>
  );
}

/** 네이티브 select + 시안의 커스텀 화살표. */
function SelectBox({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("relative block h-[42px] min-w-0", className)}>
      {children}
      <ChevronDownIcon className="pointer-events-none absolute right-[10px] top-[18px] text-black" />
    </span>
  );
}
