"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { errorMessage } from "@/lib/api/client";
import { getMyMember } from "@/lib/api/member";
import { logout as endSession, useAuthStore } from "@/lib/store/auth-store";
import { useRequireAuth } from "@/lib/store/use-require-auth";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/orders", label: "주문·결제" },
  { href: "/admin/shipments", label: "배송 준비" },
  { href: "/admin/products", label: "상품" },
  { href: "/admin/members", label: "회원" },
  { href: "/admin/coupons", label: "쿠폰" },
  { href: "/admin/banners", label: "배너" },
  { href: "/admin/notices", label: "공지" },
  { href: "/admin/contents", label: "문구" },
  { href: "/admin/shipping", label: "배송비" },
] as const;

type Access = { kind: "checking" } | { kind: "allowed" } | { kind: "denied"; message: string };

/**
 * 관리자 화면 셸: 좌측 메뉴 + 본문.
 *
 * 들어올 때마다 `/api/me` 로 권한을 다시 확인한다. 저장된 세션의 role 은 로그인 시점 값이라
 * 그 사이 권한이 바뀌었을 수 있어서다. (관리자 API 자체도 서버가 매번 DB 권한을 확인한다.)
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const ready = useRequireAuth();
  const pathname = usePathname();
  const router = useRouter();
  const setMember = useAuthStore((s) => s.setMember);
  const memberName = useAuthStore((s) => s.member?.name);
  const [access, setAccess] = useState<Access>({ kind: "checking" });

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getMyMember()
      .then((member) => {
        if (cancelled) return;
        setMember(member);
        setAccess(
          member.role === "ADMIN"
            ? { kind: "allowed" }
            : { kind: "denied", message: "관리자 권한이 있는 계정으로 로그인해 주세요." },
        );
      })
      .catch((e: unknown) => {
        if (!cancelled) setAccess({ kind: "denied", message: errorMessage(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [ready, setMember]);

  const logout = () => {
    endSession();
    router.push("/login?next=/admin");
  };

  if (access.kind !== "allowed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-page px-4">
        <div className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-6 text-center">
          <p className="font-serif text-[26px] text-brand-primary">eatomato</p>
          <p className="mt-4 text-[14px] text-ink-muted">
            {access.kind === "checking" ? "권한을 확인하고 있습니다…" : access.message}
          </p>
          {access.kind === "denied" ? (
            <div className="mt-5 flex justify-center gap-2">
              <Link href="/" className="rounded-md border border-black/15 px-4 py-2 text-[13px]">
                사이트로
              </Link>
              <button type="button" onClick={logout} className="rounded-md bg-brand-deep px-4 py-2 text-[13px] text-white">
                다른 계정으로 로그인
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" || pathname === "/admin/" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-surface-page lg:flex">
      <aside className="border-b border-black/10 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-[220px] lg:flex-none lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4 lg:block lg:py-6">
          <Link href="/admin" className="font-serif text-[24px] font-semibold text-brand-primary">
            eatomato
            <span className="ml-1.5 align-middle font-sans text-[11px] font-bold tracking-[1px] text-ink-subtle">
              ADMIN
            </span>
          </Link>
        </div>
        <nav aria-label="관리자 메뉴" className="overflow-x-auto px-3 pb-3 lg:px-3">
          <ul className="flex gap-1 lg:flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-md px-3 py-2 text-[14px] transition-colors",
                    isActive(item.href)
                      ? "bg-brand-highlight font-bold text-brand-secondary"
                      : "text-ink-muted hover:bg-black/[0.04]",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden border-t border-black/10 px-5 py-4 text-[12px] text-ink-subtle lg:absolute lg:bottom-0 lg:block lg:w-full">
          <p className="truncate">{memberName} 님</p>
          <div className="mt-2 flex gap-3">
            <Link href="/" className="hover:text-ink-body hover:underline">
              사이트로
            </Link>
            <button type="button" onClick={logout} className="hover:text-ink-body hover:underline">
              로그아웃
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
