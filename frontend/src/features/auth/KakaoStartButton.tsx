"use client";

import { KakaoIcon } from "@/components/ui/icons";

/**
 * "카카오로 시작하기" 버튼. 로그인·가입 화면이 같이 쓴다.
 * 카카오 로그인은 아직 연동 전이라 누르면 부모가 준비 중 안내를 띄운다.
 */
export function KakaoStartButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mx-auto flex h-12 w-full max-w-[264px] items-center gap-3.5 bg-[#FEE500] px-[18px] text-[15px] font-normal tracking-[-0.2px] text-black transition-opacity hover:opacity-90 ${className}`}
    >
      <span className="flex w-[22px] flex-none items-center justify-center text-black">
        <KakaoIcon />
      </span>
      <span className="flex-1 text-center">카카오로 시작하기</span>
    </button>
  );
}
