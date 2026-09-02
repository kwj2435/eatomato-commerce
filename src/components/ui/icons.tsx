import type { SVGProps } from "react";

/**
 * SVG 아이콘 셋.
 *
 * - 모든 아이콘은 `currentColor` 를 사용해 컨테이너의 `color` 로 색을 상속받는다.
 * - `SVGProps<SVGSVGElement>` 를 확장해 사용처에서 `className`, `aria-hidden`, `width/height` 를
 *   자유롭게 오버라이드할 수 있게 한다.
 * - 별도 아이콘 라이브러리(lucide 등) 없이 시안의 SVG 를 그대로 사용하기 위한 내부 세트다.
 */
type IconProps = SVGProps<SVGSVGElement>;

const baseSvgProps = {
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  focusable: false,
  "aria-hidden": true,
} as const;

export function SearchIcon(props: IconProps) {
  return (
    <svg width={22} height={22} viewBox="0 0 22 22" {...baseSvgProps} {...props}>
      <circle
        cx="9.5"
        cy="9.5"
        r="6.8"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M14.6 14.6L20 20"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg width={22} height={22} viewBox="0 0 22 22" {...baseSvgProps} {...props}>
      <circle cx="11" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M3.4 19.6C4.3 15.9 7.3 13.4 11 13.4C14.7 13.4 17.7 15.9 18.6 19.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg width={22} height={22} viewBox="0 0 22 22" {...baseSvgProps} {...props}>
      <path
        d="M1.5 2.5H4.2L6.6 13.4H17.2L19.4 5.6H5.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.2" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.3" />
      <circle
        cx="16.2"
        cy="18"
        r="1.6"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" {...baseSvgProps} {...props}>
      <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg width={15} height={15} viewBox="0 0 15 15" {...baseSvgProps} {...props}>
      <rect
        x="0.8"
        y="0.8"
        width="13.4"
        height="13.4"
        rx="3.6"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <circle cx="7.5" cy="7.5" r="3.3" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="11.3" cy="3.7" r="0.85" fill="currentColor" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg width={10} height={8} viewBox="0 0 10 8" {...baseSvgProps} {...props}>
      <path
        d="M1 4.1L3.6 6.7L9 1.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg width={13} height={13} viewBox="0 0 13 13" {...baseSvgProps} {...props}>
      <circle cx="6.5" cy="6.5" r="5.8" stroke="currentColor" strokeWidth="1" />
      <path d="M6.5 5.6V9.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="6.5" cy="3.6" r="0.75" fill="currentColor" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg width={9} height={6} viewBox="0 0 9 6" {...baseSvgProps} {...props}>
      <path
        d="M1 1L4.5 4.5L8 1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KakaoIcon(props: IconProps) {
  return (
    <svg width={18} height={17} viewBox="0 0 18 17" {...baseSvgProps} {...props}>
      <path
        d="M9 0.9C4.3 0.9 0.5 3.9 0.5 7.6C0.5 10 2.1 12.1 4.5 13.3L3.6 16.4C3.5 16.7 3.8 16.9 4 16.7L7.7 14.2C8.1 14.25 8.55 14.3 9 14.3C13.7 14.3 17.5 11.3 17.5 7.6C17.5 3.9 13.7 0.9 9 0.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg width={22} height={22} viewBox="0 0 22 22" {...baseSvgProps} {...props}>
      <path
        d="M3 6H19M3 11H19M3 16H19"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
