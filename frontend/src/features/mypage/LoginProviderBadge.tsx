import type { LoginProvider } from "@/types/member";

const PROVIDERS: Record<LoginProvider, { label: string; mark: string; className: string }> = {
  naver: { label: "네이버", mark: "N", className: "bg-[#03C75A] text-white" },
  kakao: { label: "카카오", mark: "K", className: "bg-[#FEE500] text-[#191919]" },
};

/** "N 네이버로 로그인" 처럼 연결된 소셜 로그인을 보여 준다. 소셜 계정이 아니면(관리자 등) 그리지 않는다. */
export function LoginProviderBadge({ provider, suffix = "로그인" }: { provider?: LoginProvider | null; suffix?: string }) {
  if (!provider) return null;
  const p = PROVIDERS[provider];
  return (
    <span className="inline-flex items-center gap-1.5">
      <i aria-hidden className={`inline-flex h-[15px] w-[15px] items-center justify-center rounded-[3px] text-[9px] font-extrabold not-italic ${p.className}`}>
        {p.mark}
      </i>
      {p.label}로 {suffix}
    </span>
  );
}
