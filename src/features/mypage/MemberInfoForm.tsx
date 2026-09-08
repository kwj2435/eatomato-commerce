"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";

import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
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
 * 회원 정보 폼 (시안 7p 우측 컬럼).
 *
 * 상태 관리:
 * - 서버에서 받은 `member` 를 초기값으로 삼는 controlled input 묶음이다.
 * - 아이디/등급/우편번호/기본주소는 시안에서 readonly 이므로 상태로 들지 않고 prop 을 그대로 쓴다.
 *   (우편번호·기본주소는 주소 검색이 붙으면 그때 상태로 승격시킨다.)
 *
 * 저장/로그아웃/주소검색은 실 API 가 없어 LoginForm 과 동일하게 mock 안내 문구로 처리한다.
 * 실 API 연동 시 `updateMyMember()` 를 서버 액션으로 감싸고 `useActionState` 로 교체하면 된다.
 */
export function MemberInfoForm({ member }: MemberInfoFormProps) {
  const fieldId = useId();
  const id = (name: string) => `${fieldId}-${name}`;

  const [email, setEmail] = useState(member.email);
  const [name, setName] = useState(member.name);
  const [phone, setPhone] = useState(member.phone);
  const [addressDetail, setAddressDetail] = useState(member.address.detail);
  const [birthYear, setBirthYear] = useState(member.birthDate?.year ?? null);
  const [birthMonth, setBirthMonth] = useState(member.birthDate?.month ?? null);
  const [birthDay, setBirthDay] = useState(member.birthDate?.day ?? null);
  const [gender, setGender] = useState<MemberGender | null>(member.gender);
  const [marketing, setMarketing] = useState<MarketingChannel[]>(
    member.marketingChannels,
  );
  const [status, setStatus] = useState<Status>({ kind: "idle" });

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

    // TODO: 실제 API 로 교체 — updateMyMember({ email, name, phone, ... })
    setStatus({
      kind: "success",
      message: "변경 사항을 저장했습니다. (mock 응답)",
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setStatus({
            kind: "error",
            message: "로그아웃은 로그인 연동 이후 동작합니다.",
          })
        }
        className="mt-[35px] block w-full text-right text-[12px] leading-4 tracking-[-0.2px] text-[#BCB3B0] transition-colors hover:text-ink-muted"
      >
        로그아웃
      </button>

      <form onSubmit={handleSubmit} noValidate>
        <Field label="아이디" htmlFor={id("id")}>
          <input
            id={id("id")}
            type="text"
            value={member.id}
            readOnly
            className={cn(inputClass, readonlyClass)}
          />
        </Field>

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

        <Field label="등급" htmlFor={id("grade")}>
          <input
            id={id("grade")}
            type="text"
            value={member.grade}
            readOnly
            className={cn(inputClass, readonlyClass)}
          />
        </Field>

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
          <span className="w-6 flex-none text-center text-[13px] text-black">
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
          <span className="w-6 flex-none text-center text-[13px] text-black">
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

        <Field label="우편번호" htmlFor={id("zip")} rowClassName="gap-[11px]">
          <input
            id={id("zip")}
            type="text"
            value={member.address.zipCode}
            readOnly
            className={cn(inputClass, readonlyClass, "flex-1")}
          />
          <button
            type="button"
            onClick={() =>
              setStatus({
                kind: "error",
                message: "주소 검색은 준비 중입니다.",
              })
            }
            className="h-[42px] w-[131px] flex-none border border-[#B7BBCC] text-[12px] font-bold tracking-[-0.2px] text-black transition-colors hover:bg-black hover:text-white"
          >
            검색하기
          </button>
        </Field>

        {/* 주소만 입력 행이 둘(기본 주소 readonly + 상세 주소)이라 Field 대신 직접 구성한다. */}
        <div className="mt-4">
          <label htmlFor={id("addr")} className={fieldLabelClass}>
            주소
          </label>
          <div className="mt-[9px] flex items-center">
            <input
              id={id("addr")}
              type="text"
              value={member.address.road}
              readOnly
              className={cn(inputClass, readonlyClass)}
            />
          </div>
          <div className="mt-[9px] flex items-center">
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
        <Field label="생년월일" htmlFor={id("year")} rowClassName="flex-wrap gap-6 gap-y-[9px]">
          <SelectBox className="w-[157px]">
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
                  {year}
                </option>
              ))}
            </select>
          </SelectBox>

          <SelectBox className="w-[106px]">
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
                  {month}
                </option>
              ))}
            </select>
          </SelectBox>

          <SelectBox className="w-[105px]">
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
                  {day}
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

        <div className="mt-[13px] flex items-center justify-center gap-6">
          <Link href="/mypage/password" className={subLinkClass}>
            비밀번호 변경하기
          </Link>
          <Link href="/mypage/withdraw" className={subLinkClass}>
            탈퇴하기
          </Link>
        </div>

        <div className="mt-[26px] flex justify-center">
          <button
            type="submit"
            className="h-[49px] w-[210px] bg-[#062B62] text-[13px] font-bold tracking-[-0.2px] text-white transition-opacity hover:opacity-90"
          >
            변경 사항 저장하기
          </button>
        </div>

        {status.kind !== "idle" ? (
          <p
            role="status"
            aria-live="polite"
            className={cn(
              "mt-4 text-center text-[13px] tracking-[-0.2px]",
              status.kind === "error" ? "text-brand-primary" : "text-[#062B62]",
            )}
          >
            {status.message}
          </p>
        ) : null}
      </form>
    </>
  );
}

// ────────────────────────────────────────────────────────────────
// 시안 `.input` / `.select` / `.member__link` 규격. 여러 필드가 공유하므로 상수로 뺀다.

const inputClass =
  "h-[42px] w-full min-w-0 border border-[#B7BBCC] bg-transparent px-3.5 text-[13px] tracking-[-0.2px] text-black outline-none placeholder:text-[#A6A2A7] focus:border-black";

const readonlyClass = "cursor-default bg-[#FBF1F1] focus:border-[#B7BBCC]";

const selectClass =
  "h-[42px] w-full appearance-none border border-[#B7BBCC] bg-transparent pl-4 pr-7 text-[13px] tracking-[-0.2px] text-black outline-none focus:border-black";

const fieldLabelClass =
  "block text-[12px] leading-[18px] tracking-[-0.2px] text-black";

const subLinkClass =
  "text-[12px] leading-[17px] tracking-[-0.2px] text-[#A6A2A7] underline-offset-2 transition-colors hover:text-ink-muted hover:underline";

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
      <div className={cn("mt-[9px] flex items-center", rowClassName)}>
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
 * `appearance-none` 위에 시안의 파란 체크/도트를 CSS 로 그린다.
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
          "relative h-[13px] w-[13px] flex-none appearance-none border border-[#A09A9A] bg-transparent outline-none",
          "before:absolute before:content-['']",
          "focus-visible:ring-2 focus-visible:ring-[#0070F5]/40",
          type === "radio"
            ? "rounded-full checked:border-2 checked:border-[#0070F5] checked:bg-white before:inset-px before:rounded-full checked:before:bg-[#0070F5]"
            : "rounded-[2px] checked:border-[#0070F5] checked:bg-[#0070F5] before:left-[2px] before:top-0 before:h-[3px] before:w-[6px] before:-rotate-45 checked:before:border-b-[1.6px] checked:before:border-l-[1.6px] checked:before:border-white",
        )}
      />
      <span className="text-[12px] tracking-[-0.2px] text-black">{label}</span>
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
    <span className={cn("relative h-[42px] flex-none", className)}>
      {children}
      <ChevronDownIcon className="pointer-events-none absolute right-[9px] top-[19px] text-black" />
    </span>
  );
}
