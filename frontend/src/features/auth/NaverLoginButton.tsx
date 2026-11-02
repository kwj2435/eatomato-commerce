"use client";

/**
 * 네이버 로그인 버튼. 네이버 로그인 버튼 사용 가이드를 따른다.
 * https://developers.naver.com/docs/login/bi/bi.md
 *
 * - 컨테이너 네이버 그린 #03C75A, 흰색 N 심볼 + "네이버 로그인"
 * - 카카오 버튼과 같은 크기·모서리로 나란히 둔다
 */
export function NaverLoginButton({
  onClick,
  disabled,
  className = "",
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`mx-auto flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#03C75A] transition-opacity hover:opacity-90 disabled:opacity-60 ${className}`}
      style={{ fontFamily: "system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif" }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden focusable="false">
        <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z" fill="#FFFFFF" />
      </svg>
      <span className="text-[15px] font-semibold leading-none text-white">네이버 로그인</span>
    </button>
  );
}
