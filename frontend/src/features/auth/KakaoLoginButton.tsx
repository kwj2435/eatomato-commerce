"use client";

/**
 * 카카오 로그인 버튼. 카카오 로그인 디자인 가이드를 따른다.
 * https://developers.kakao.com/docs/ko/kakaologin/design-guide
 *
 * - 컨테이너 #FEE500, 모서리 12px
 * - 심볼: 카카오 공식 말풍선(리소스의 login-complete-ko.svg 에서 그대로 가져옴), #000000 — 모양·비율·색 변경 금지
 * - 레이블: "카카오 로그인", #000000 85%, OS 기본 서체, 높이는 컨테이너의 1/3 이하
 * - 심볼과 레이블은 한 묶음으로 가운데 정렬
 */
export function KakaoLoginButton({
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
      className={`mx-auto flex h-12 w-full max-w-[264px] items-center justify-center gap-2 rounded-[12px] bg-[#FEE500] transition-opacity hover:opacity-90 disabled:opacity-60 ${className}`}
      style={{ fontFamily: "system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif" }}
    >
      <svg width="18" height="18" viewBox="61.5225 16.5225 12.9555 12.9555" aria-hidden focusable="false">
        <path
          d="M68.001 16.5225C64.4222 16.5225 61.5225 19.0037 61.5225 22.0641C61.5225 24.0312 62.7219 25.7596 64.5292 26.7423L63.9181 29.2113C63.8954 29.285 63.9132 29.364 63.9619 29.4184C63.9975 29.457 64.0461 29.478 64.0931 29.478C64.1337 29.478 64.1742 29.464 64.2082 29.4341L66.834 27.5144C67.2117 27.5723 67.6007 27.6039 67.9994 27.6039C71.5767 27.6039 74.478 25.1226 74.478 22.0623C74.478 19.002 71.5783 16.5225 68.001 16.5225Z"
          fill="#000000"
        />
      </svg>
      <span className="text-[15px] font-medium leading-none" style={{ color: "rgba(0, 0, 0, 0.85)" }}>
        카카오 로그인
      </span>
    </button>
  );
}
