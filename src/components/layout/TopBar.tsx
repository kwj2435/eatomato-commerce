"use client";

import { useState } from "react";

import { CloseIcon } from "@/components/ui/icons";

type TopBarProps = {
  message: string;
};

/**
 * 페이지 최상단 검정 공지 바.
 *
 * 시안(main-page.html)의 상단 공지 바이며, 닫기 버튼으로 세션 동안 감출 수 있다.
 * 사용자 상호작용이 있어 클라이언트 컴포넌트로 표시한다.
 * 방문마다 다시 열리도록 상태만 로컬로 유지하고, 영속화(localStorage)는 하지 않는다.
 */
export function TopBar({ message }: TopBarProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="relative flex h-[55px] w-full items-center justify-center bg-ink-body px-14">
      <p className="text-[14px] font-normal tracking-[-0.2px] text-ink-inverse">
        {message}
      </p>
      <button
        type="button"
        aria-label="공지 닫기"
        onClick={() => setVisible(false)}
        className="absolute right-8 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-ink-inverse transition-opacity hover:opacity-70"
      >
        <CloseIcon />
      </button>
    </div>
  );
}
