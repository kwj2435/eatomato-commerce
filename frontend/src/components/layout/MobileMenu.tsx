"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { NavLink } from "@/components/layout/NavLink";
import { ChevronDownIcon, MenuIcon } from "@/components/ui/icons";
import { useLogout } from "@/features/auth/useLogout";
import { useAuthStore, useIsLoggedIn } from "@/lib/store/auth-store";
import { useHydrated } from "@/lib/store/use-hydrated";
import { cn } from "@/lib/utils/cn";

export type MobileNavItem = {
  label: string;
  href: string;
  children?: Array<{ label: string; href: string }>;
};

type MobileMenuProps = {
  items: MobileNavItem[];
};

/**
 * 모바일(lg 미만) 햄버거 메뉴 + 좌측 드로어 (모바일 2차 시안 2p).
 *
 * - 드로어: 화면 왼쪽 84% 패널(최대 340px), 나머지는 어두운 오버레이. 오버레이를 누르면 닫힌다.
 * - 하위 분류가 있는 메인 탭(Phone Case / Earphone Case / Accessories)은 누르면 상세 탭이 아코디언으로 펼쳐진다.
 *   하위 분류가 없는 탭은 바로 해당 페이지로 이동한다.
 * - 열려 있는 동안 body 스크롤을 잠그고, Esc 로도 닫을 수 있다.
 * - 닫힌 상태에서도 DOM 에 남겨 슬라이드 전환을 주고, `inert` 로 탭 이동 대상에서 뺀다.
 */
export function MobileMenu({ items }: MobileMenuProps) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const hydrated = useHydrated();
  const loggedIn = useIsLoggedIn();
  const isAdmin = useAuthStore((s) => s.member?.role === "ADMIN");
  const logout = useLogout();

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        aria-expanded={open}
        aria-controls={panelId}
        className="relative flex h-[22px] w-[22px] items-center justify-center text-ink-icon lg:hidden before:absolute before:-inset-[11px] before:content-['']"
      >
        <MenuIcon />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "visible" : "invisible",
        )}
        // 닫혀 있을 땐 inert 로 포커스·보조기기 접근을 함께 막는다.
        inert={!open}
      >
        {/* 오버레이 — 우측 상단에 닫기(햄버거) 버튼을 둔다(시안). */}
        <div
          onClick={close}
          className={cn(
            "absolute inset-0 bg-[#3D3B3A]/90 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <button
          type="button"
          onClick={close}
          aria-label="메뉴 닫기"
          className="absolute right-5 top-[18px] flex h-[22px] w-[22px] items-center justify-center text-black before:absolute before:-inset-[11px] before:content-['']"
        >
          <MenuIcon />
        </button>

        <nav
          id={panelId}
          aria-label="모바일 메뉴"
          className={cn(
            "absolute inset-y-0 left-0 flex w-[84%] max-w-[340px] flex-col overflow-y-auto bg-[#FBE7E1] px-[30px] pb-10 pt-[18px] transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Link
            href="/"
            onClick={close}
            className="font-serif text-[35px] font-semibold leading-none text-brand-deep"
          >
            eatomato
          </Link>

          <ul className="mt-[46px] flex flex-col gap-[38px]">
            {items.map((item) => {
              const hasChildren = Boolean(item.children?.length);
              const isExpanded = expanded === item.href;
              const itemClass =
                "flex w-full items-center justify-between text-left text-[19px] font-bold leading-6 tracking-[-0.2px] text-brand-deep";

              return (
                <li key={item.href}>
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? null : item.href)}
                      aria-expanded={isExpanded}
                      className={itemClass}
                    >
                      {item.label}
                      <ChevronDownIcon
                        width={14}
                        height={9}
                        className={cn("transition-transform", isExpanded && "rotate-180")}
                      />
                    </button>
                  ) : (
                    <NavLink
                      href={item.href}
                      onClick={close}
                      className={itemClass}
                      activeClassName="text-brand-primary"
                    >
                      {item.label}
                    </NavLink>
                  )}

                  {hasChildren && isExpanded ? (
                    <ul className="mt-5 flex flex-col gap-4 pl-6">
                      {item.children!.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={close}
                            className="text-[17px] font-medium leading-6 tracking-[-0.2px] text-brand-deep"
                          >
                            - {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {/* 계정 바로가기. 로그인 여부는 하이드레이션 뒤에 알 수 있어 그 전에는 그리지 않는다. */}
          {hydrated ? (
            <ul className="mt-auto flex flex-col gap-3 border-t border-black/10 pt-6 text-[15px] text-ink-muted">
              {loggedIn ? (
                <>
                  {/* 데스크톱 헤더의 ADMIN 배지는 모바일에서 숨기므로 관리자 바로가기를 여기 둔다. */}
                  {isAdmin ? (
                    <li>
                      <Link href="/admin" onClick={close} className="font-bold text-brand-primary hover:text-black">
                        관리자 화면
                      </Link>
                    </li>
                  ) : null}
                  <li>
                    <Link href="/mypage" onClick={close} className="hover:text-black">
                      마이페이지
                    </Link>
                  </li>
                  <li>
                    <Link href="/mypage/profile" onClick={close} className="hover:text-black">
                      회원 정보 수정
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        logout();
                      }}
                      className="hover:text-black"
                    >
                      로그아웃
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link href="/login" onClick={close} className="hover:text-black">
                    로그인
                  </Link>
                </li>
              )}
            </ul>
          ) : null}
        </nav>
      </div>
    </>
  );
}
