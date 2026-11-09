"use client";

import Link from "next/link";

import { UserIcon } from "@/components/ui/icons";
import { useLogout } from "@/features/auth/useLogout";
import { useIsLoggedIn } from "@/lib/store/auth-store";
import { useHydrated } from "@/lib/store/use-hydrated";
import { cn } from "@/lib/utils/cn";

/**
 * 헤더의 회원 아이콘. 로그인 상태를 한눈에 알 수 있게 한다.
 * - 로그인: 마이페이지로 가고, 아이콘 우측 아래에 작은 점을 찍는다.
 *   데스크톱(lg 이상)에서는 마우스를 올리거나 키보드로 들어오면 계정 메뉴(마이페이지·회원 정보 수정·로그아웃)가 열린다.
 *   GNB 드롭다운과 같은 group-hover/focus-within 방식이고, 모바일은 햄버거 메뉴(MobileMenu)가 대신한다.
 * - 비로그인: 로그인 화면으로 간다.
 * 하이드레이션 전에는 로그인 여부를 몰라 점 없이 마이페이지 링크로 그린다(마이페이지가 비로그인이면 로그인으로 보낸다).
 */
export function HeaderUserLink() {
  const hydrated = useHydrated();
  const loggedIn = useIsLoggedIn();
  const logout = useLogout();
  const showLoggedIn = hydrated && loggedIn;
  const loggedOut = hydrated && !loggedIn;

  return (
    <div className="group relative flex">
      <Link
        href={loggedOut ? "/login" : "/mypage"}
        aria-label={loggedOut ? "로그인" : "마이페이지"}
        title={showLoggedIn ? "로그인됨 · 마이페이지" : loggedOut ? "로그인" : undefined}
        className="relative flex h-[22px] w-[22px] items-center justify-center transition-opacity hover:opacity-70 before:absolute before:-inset-x-[6px] before:-inset-y-[11px] before:content-['']"
      >
        <UserIcon />
        {showLoggedIn ? (
          <span aria-hidden className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-surface-primary bg-brand-primary" />
        ) : null}
      </Link>

      {showLoggedIn ? (
        // 아이콘과 패널 사이(pt-3)도 이 div 가 덮어 마우스를 내려도 메뉴가 닫히지 않는다.
        <div
          className={cn(
            "invisible absolute right-[-12px] top-full z-20 hidden pt-3 opacity-0 transition-[opacity,visibility] duration-150 lg:block",
            "group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100",
          )}
        >
          <div className="flex w-[150px] flex-col gap-3.5 border border-[#F0E2DE] bg-surface-elevated px-5 py-[18px] shadow-[0_8px_20px_rgba(33,33,33,0.08)]">
            <Link href="/mypage" className={MENU_ITEM}>
              마이페이지
            </Link>
            <Link href="/mypage/profile" className={MENU_ITEM}>
              회원 정보 수정
            </Link>
            <button type="button" onClick={logout} className={cn(MENU_ITEM, "border-t border-[#F0E2DE] pt-3.5 text-left")}>
              로그아웃
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const MENU_ITEM = "text-[14px] font-normal tracking-[-0.2px] text-[#3D3D3D] transition-colors hover:text-brand-primary";
