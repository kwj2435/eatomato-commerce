"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/** 지금 보고 있는 페이지가 이 메뉴(또는 그 하위 주소)인지. trailingSlash 유무와 상관없이 비교한다. */
export function isActivePath(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const strip = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);
  const current = strip(pathname);
  const target = strip(href);
  return current === target || current.startsWith(`${target}/`);
}

type NavLinkProps = {
  href: string;
  className?: string;
  /** 현재 페이지일 때 더할 클래스. */
  activeClassName?: string;
  onClick?: () => void;
  children: ReactNode;
};

/** 현재 페이지면 `aria-current="page"` 와 activeClassName 을 붙이는 링크. */
export function NavLink({ href, className, activeClassName, onClick, children }: NavLinkProps) {
  const active = isActivePath(usePathname(), href);
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(className, active && activeClassName)}
    >
      {children}
    </Link>
  );
}
