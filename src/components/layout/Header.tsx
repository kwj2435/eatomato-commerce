import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { HeaderCartLink } from "@/components/layout/HeaderCartLink";
import { SearchIcon, UserIcon } from "@/components/ui/icons";
import {
  CATEGORY_LIST,
  categoryHref,
  hasSubcategories,
} from "@/features/product-list/categories";
import { cn } from "@/lib/utils/cn";

/**
 * GNB 정의.
 *
 * Phone Case / Phone ACC / SET ITEM 항목은 `features/product-list/categories.ts` 를
 * 단일 진실 원천으로 삼아 그 목록에서 파생시킨다. 카테고리를 추가·변경할 때
 * 헤더와 라우트가 동시에 갱신되어 서로 엇갈릴 여지를 없앤다.
 */
type NavItem = {
  label: string;
  href: string;
  children?: Array<{ label: string; href: string }>;
};

const CATEGORY_NAV_ITEMS: NavItem[] = CATEGORY_LIST.map((category) => ({
  label: category.label,
  href: categoryHref(category.slug),
  // "All" 하나뿐인 카테고리(SET ITEM)는 시안대로 드롭다운 없이 단독 링크로 둔다.
  children: hasSubcategories(category)
    ? category.subcategories.map((sub) => ({
        label: sub.label,
        href: categoryHref(category.slug, sub.slug),
      }))
    : undefined,
}));

const NAV_ITEMS: NavItem[] = [
  ...CATEGORY_NAV_ITEMS,
  { label: "About", href: "/about" },
  { label: "Notice", href: "/notice" },
];

/**
 * 사이트 공통 헤더.
 *
 * 상호작용:
 * - GNB 드롭다운은 CSS `group-hover` + `focus-within` 으로 열린다.
 *   자바스크립트 없이도 마우스/키보드 접근성이 유지된다.
 *
 * 반응형:
 * - lg(1024) 이상에서 GNB 를 노출한다. 그보다 좁을 땐 유틸 아이콘만 유지한다.
 *   (모바일 드로어 메뉴는 다음 이터레이션에서 추가 예정)
 */
export function Header() {
  return (
    <header className="w-full bg-surface-primary">
      <Container className="flex h-[110px] items-center justify-between">
        <Link
          href="/"
          className="font-serif text-[38px] font-medium leading-none tracking-[-0.5px] text-brand-primary"
        >
          eatomato
        </Link>

        <div className="flex items-center gap-7">
          <nav aria-label="주요 메뉴" className="hidden lg:block">
            <ul className="flex items-center gap-[30px]">
              {NAV_ITEMS.map((item) => (
                <NavItemNode key={item.href} item={item} />
              ))}
            </ul>
          </nav>

          {/*
           * 유틸 아이콘 그룹.
           * 시안 CSS 는 #FFFDF8 배경(살짝 밝은 크림)을 갖지만, 실제 헤더 배경(#FFF5F5) 위에서
           * 흰 덩어리처럼 튀어 이질감이 컸다. 배경을 걷어내고 헤더 톤 위에 아이콘만 얹어
           * GNB 와 시각적 무게를 맞췄다.
           */}
          <div className="flex items-center gap-3 text-ink-icon">
            <UtilLink href="/search" label="검색">
              <SearchIcon />
            </UtilLink>
            <UtilLink href="/mypage" label="마이페이지">
              <UserIcon />
            </UtilLink>
            {/* 카트는 스토어 구독이 필요해 client 컴포넌트로 분리 */}
            <HeaderCartLink />
          </div>
        </div>
      </Container>
    </header>
  );
}

/**
 * 개별 GNB 항목.
 * `group` 유틸 + `group-hover`/`group-focus-within` 으로 드롭다운을 여닫아
 * JS 없이도 마우스와 키보드(탭 이동) 양쪽을 지원한다.
 */
function NavItemNode({ item }: { item: NavItem }) {
  const hasChildren = Boolean(item.children?.length);

  return (
    <li
      className={cn(
        "group flex h-[110px] items-center",
        hasChildren && "focus-within:z-10 hover:z-10",
      )}
    >
      {/*
       * 기준점(relative)을 li 가 아니라 링크 텍스트 줄에 둔다.
       *
       * 시안 CSS 는 `top: 110px`(헤더 바닥)이었는데, 링크는 110px 헤더의 세로 중앙에 있어
       * 텍스트와 패널 사이에 약 45px 의 빈 공간이 생겼다. 패널이 헤더가 아니라
       * 메인 배너에서 떨어지는 것처럼 보이는 원인이다.
       * 텍스트 줄 박스를 기준으로 삼으면 `top-full + mt-3` 만으로 "글자 12px 아래" 가 된다.
       *
       * 호버는 그대로 유지된다 — 패널이 li 의 자손이라 패널 위에서도 `group-hover` 가 살아 있고,
       * 텍스트와 패널 사이 구간은 li(높이 110px)가 덮는다.
       */}
      <div className="relative">
        <Link
          href={item.href}
          className="text-[16px] font-normal tracking-[-0.2px] text-brand-secondary transition-opacity hover:opacity-70"
        >
          {item.label}
        </Link>

        {hasChildren && (
          <div
            className={cn(
              "invisible absolute left-[-20px] top-full mt-3 opacity-0 transition-[opacity,visibility] duration-150",
              "group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100",
            )}
          >
            <div className="flex w-[180px] flex-col gap-3.5 border border-[#F0E2DE] bg-surface-elevated px-5 py-[18px] shadow-[0_8px_20px_rgba(33,33,33,0.08)]">
              {item.children!.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="text-[14px] font-normal tracking-[-0.2px] text-[#3D3D3D] transition-colors hover:text-brand-primary"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function UtilLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-[22px] w-[22px] items-center justify-center transition-opacity hover:opacity-70"
    >
      {children}
    </Link>
  );
}
