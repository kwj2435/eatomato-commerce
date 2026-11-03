"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { CloseIcon } from "@/components/ui/icons";

import { QuantityStepper } from "@/features/cart/QuantityStepper";
import type { AddCartItemInput } from "@/lib/api/cart";
import { errorMessage } from "@/lib/api/client";
import { getProductDetail } from "@/lib/api/products";
import { useCartStore } from "@/lib/store/cart-store";
import { cn } from "@/lib/utils/cn";
import { formatKRW } from "@/lib/utils/format";
import type { OptionGroup, ProductDetail } from "@/types/product-detail";
import type { ShippingPolicy } from "@/types/shipping";

import { BetterTogether } from "./BetterTogether";
import { OptionSelect } from "./OptionSelect";

type ProductBuyPanelProps = {
  product: ProductDetail;
  shippingPolicy: ShippingPolicy;
};

/** 옵션 그룹 id → 선택된 choice id */
type SelectionMap = Record<string, string>;

type Status =
  | { kind: "idle" }
  | { kind: "warn"; message: string }
  | { kind: "success"; message: string };

/**
 * 상세 페이지 우측 구매 패널 (핵심 클라이언트).
 *
 * 상태 소유:
 * - 메인 상품 옵션 선택 · 수량
 * - BETTER TOGETHER 각 항목의 옵션 선택
 * - 액션 결과 status 배너
 *
 * 파생 값:
 * - 옵션 가격 델타 합 → 실 결제단가 → 총 상품 금액
 * - 카트 담기 대상 목록(메인 + 옵션 완성된 BT)
 *
 * 화면 구성:
 * - 상품명·할인율·가격·안내문(접힘)·적립금·배송비는 항상 보인다.
 * - 옵션·수량·합계·구매 버튼(purchaseForm)은 PC(lg 이상)면 패널 안에, 모바일이면 화면 아래 구매 바를 눌러
 *   올라오는 옵션 창 안에 그린다. 상세 이미지를 보다가도 그 자리에서 살 수 있게 하려는 것.
 * - 화면 아래 구매 바: 모바일은 항상, PC 는 패널의 구매 버튼이 화면 밖으로 나갔을 때만 보인다.
 *
 * 이 컴포넌트 하나가 "구매 로직" 전부를 알고 있어, 정책 변경(예: 옵션 없는 상품 처리)을 한 곳에서 손볼 수 있다.
 * 화면의 금액은 미리보기이고, 실제 단가는 장바구니에 담을 때 서버가 다시 계산한다.
 */
export function ProductBuyPanel({ product: initial, shippingPolicy }: ProductBuyPanelProps) {
  // 상세 페이지는 최대 1분 캐시되므로, 재고·품절은 열릴 때 최신 값으로 한 번 더 맞춘다.
  const [stock, setStock] = useState({ stock: initial.stock, soldOut: initial.soldOut });
  useEffect(() => {
    let cancelled = false;
    getProductDetail(initial.slug)
      .then((fresh) => {
        if (!cancelled && fresh) setStock({ stock: fresh.stock, soldOut: fresh.soldOut });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initial.slug]);
  const product = { ...initial, ...stock };
  const [mainSelection, setMainSelection] = useState<SelectionMap>({});
  const [quantity, setQuantity] = useState(1);
  const [btSelections, setBtSelections] = useState<
    Record<string, SelectionMap>
  >({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, setPending] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const inlineFormRef = useRef<HTMLDivElement>(null);
  const inlineFormVisible = useInView(inlineFormRef);

  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  const basePrice = product.salePrice ?? product.price;

  const mainUnitPrice = useMemo(
    () => basePrice + sumOptionDelta(product.optionGroups, mainSelection),
    [basePrice, product.optionGroups, mainSelection],
  );

  const mainReady = allGroupsChosen(product.optionGroups, mainSelection);

  const mainLineTotal = mainReady ? mainUnitPrice * quantity : 0;

  const readyBTItems = useMemo(
    () =>
      product.betterTogether
        .filter((item) => !item.soldOut)
        .map((item) => {
          const selection = btSelections[item.id] ?? {};
          if (!allGroupsChosen(item.optionGroups, selection)) return null;
          const unit =
            (item.salePrice ?? item.price) +
            sumOptionDelta(item.optionGroups, selection);
          return { item, selection, unit };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null),
    [product.betterTogether, btSelections],
  );

  const btTotal = readyBTItems.reduce((sum, { unit }) => sum + unit, 0);
  const grandTotal = mainLineTotal + btTotal;
  const orderQuantity = (mainReady ? quantity : 0) + readyBTItems.length;

  const changeBTSelection = (
    itemId: string,
    groupId: string,
    choiceId: string,
  ) => {
    setBtSelections((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? {}), [groupId]: choiceId },
    }));
  };

  /**
   * 메인 상품 + 옵션을 고른 BETTER TOGETHER 상품을 장바구니에 담는다.
   * 성공하면 true. "바로 구매하기" 는 담은 뒤 장바구니 화면으로 이동한다.
   * 비로그인이면 브라우저 장바구니에 담는다(비회원 주문).
   */
  const addToCart = async (): Promise<boolean> => {
    if (!mainReady) {
      setStatus({ kind: "warn", message: "옵션을 모두 선택해 주세요." });
      return false;
    }

    const inputs: AddCartItemInput[] = [
      { productId: product.id, options: mainSelection, quantity },
      ...readyBTItems.map(({ item, selection }) => ({
        productId: item.id,
        options: selection,
        quantity: 1,
      })),
    ];

    setPending(true);
    try {
      // 순서대로 담는다. 같은 줄로 합쳐지는 경우가 있어 병렬 요청은 피한다.
      for (const input of inputs) await addItem(input);
      setStatus({
        kind: "success",
        message: `장바구니에 ${inputs.length}건이 담겼습니다.`,
      });
      return true;
    } catch (error) {
      setStatus({ kind: "warn", message: errorMessage(error) });
      return false;
    } finally {
      setPending(false);
    }
  };

  const handleAddToCart = () => {
    void addToCart();
  };

  const handleBuyNow = async () => {
    if (await addToCart()) router.push("/cart");
  };

  const discountRate =
    product.salePrice !== undefined && product.salePrice < product.price
      ? Math.round((1 - product.salePrice / product.price) * 100)
      : 0;
  const rewardAmount = Math.floor((basePrice * product.rewardRate) / 100);

  /** 화면 아래 구매 바의 버튼. 모바일은 옵션 창을 열고, PC 는 옵션을 다 골랐으면 바로 처리한다. */
  const handleBarAction = (action: "buy" | "cart") => {
    if (!isDesktop) {
      setSheetOpen(true);
      return;
    }
    if (!mainReady) {
      setStatus({ kind: "warn", message: "옵션을 모두 선택해 주세요." });
      inlineFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (action === "buy") void handleBuyNow();
    else handleAddToCart();
  };

  // 옵션·수량·합계·버튼. PC 는 패널 안에, 모바일은 아래에서 올라오는 옵션 창 안에 같은 내용을 그린다(상태는 하나).
  const purchaseForm = (
    <>
      {product.optionGroups.length > 0 ? (
        <div className="flex flex-col gap-5">
          {product.optionGroups.map((group) => (
            <OptionSelect
              key={group.id}
              group={group}
              value={mainSelection[group.id] ?? null}
              onChange={(choiceId) =>
                setMainSelection((prev) => ({ ...prev, [group.id]: choiceId }))
              }
            />
          ))}
        </div>
      ) : null}

      {mainReady ? (
        <div className="mt-4 border border-[#E1D9D6] bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col text-[14px] leading-[20px] tracking-[-0.2px] text-black">
              <span className="font-medium">{product.name}</span>
              <span className="text-[13px] text-[#545454]">
                {describeSelection(product.optionGroups, mainSelection)}
              </span>
            </div>
            <button
              type="button"
              aria-label="고른 옵션 지우기"
              onClick={() => {
                setMainSelection({});
                setQuantity(1);
              }}
              className="-m-1 flex-none p-1 text-ink-subtle hover:text-black"
            >
              <CloseIcon width={12} height={12} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <QuantityStepper value={quantity} onChange={setQuantity} label="주문 수량" />
            </div>
            <span className="text-[15px] font-semibold tracking-[-0.2px] text-black">
              {formatKRW(mainLineTotal)}
            </span>
          </div>
        </div>
      ) : null}

      <BetterTogether
        items={product.betterTogether}
        selections={btSelections}
        onChangeSelection={changeBTSelection}
      />

      <div className="mt-5 flex items-baseline justify-between border-t border-[#E1D9D6] pt-4">
        <span className="text-[14px] font-bold tracking-[-0.2px] text-ink-body">
          총 상품 금액 <span className="text-[13px] font-normal text-ink-subtle">({orderQuantity}개)</span>
        </span>
        <span className="text-[22px] font-bold tracking-[-0.4px] text-black">{formatKRW(grandTotal)}</span>
      </div>

      <div className="mt-5 flex gap-2.5 lg:gap-3">
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={pending || product.soldOut}
          className={cn(primaryButton, "order-2 flex-[2] lg:order-1 lg:flex-1")}
        >
          {product.soldOut ? "품절" : "바로 구매하기"}
        </button>
        {product.soldOut ? null : (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={pending}
            className={cn(secondaryButton, "order-1 flex-1 lg:order-2")}
          >
            장바구니 담기
          </button>
        )}
      </div>

      <StatusMessage status={status} />
    </>
  );

  return (
    <div className="flex w-full flex-col lg:w-[499px] lg:flex-none">
      {product.badges?.length ? (
        <div className="mb-2 flex gap-1">
          {product.badges.map((badge) => (
            <span
              key={badge}
              className={cn(
                "px-1.5 py-px text-[10px] font-bold leading-[16px] tracking-[0.4px] text-ink-inverse md:text-[11px]",
                badge === "SALE" ? "bg-black" : "bg-brand-badge",
              )}
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}

      <h1 className="text-[19px] font-semibold leading-[1.4] tracking-[-0.3px] text-black md:text-[24px]">
        {product.name}
      </h1>

      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 tracking-[-0.3px] md:mt-2.5">
        {discountRate > 0 ? (
          <span className="text-[20px] font-bold text-brand-primary md:text-[24px]">{discountRate}%</span>
        ) : null}
        <span className="text-[20px] font-bold text-black md:text-[24px]">{formatKRW(basePrice)}</span>
        {discountRate > 0 ? (
          <span className="text-[14px] text-ink-subtle line-through md:text-[16px]">
            <span className="sr-only">정가 </span>
            {formatKRW(product.price)}
          </span>
        ) : null}
      </p>

      <ProductNotice lines={product.noticeLines} />

      <dl className="mt-4 flex flex-col gap-2 md:mt-6 md:gap-2.5">
        <SpecRow label="적립금">
          <span>
            {product.rewardRate}%{rewardAmount > 0 ? ` (${formatKRW(rewardAmount)})` : ""}
          </span>
        </SpecRow>
        {/* 관리자 > 배송비 설정값으로 만든다(예전엔 70,000원 고정 문구였다). */}
        <SpecRow label="배송비">
          {shippingPolicy.freeThreshold <= 0 ? (
            <span>무료배송</span>
          ) : (
            <span>
              {formatKRW(shippingPolicy.baseFee)} ·{" "}
              <span className="text-brand-primary">{formatKRW(shippingPolicy.freeThreshold)} 이상 무료</span>
            </span>
          )}
          {shippingPolicy.remoteAreaFee > 0 ? <span>제주 지역 {formatKRW(shippingPolicy.remoteAreaFee)} 추가</span> : null}
        </SpecRow>
        {product.stock !== undefined && product.stock > 0 && product.stock <= 5 ? (
          <SpecRow label="재고">
            <span className="text-brand-primary">{product.stock}개 남음</span>
          </SpecRow>
        ) : null}
      </dl>

      {/* PC: 패널 안에 바로 보인다. 모바일은 숨기고 아래 구매 바 → 옵션 창에서 고른다. */}
      <div ref={inlineFormRef} className="mt-6 hidden flex-col lg:flex">
        <div className="mb-5 h-px w-full bg-[#E1D9D6]" />
        {purchaseForm}
      </div>

      <BuyBar
        product={product}
        basePrice={basePrice}
        discountRate={discountRate}
        hidden={isDesktop && inlineFormVisible}
        pending={pending}
        status={isDesktop ? status : { kind: "idle" }}
        onAction={handleBarAction}
      />

      {sheetOpen && !isDesktop ? (
        <PurchaseSheet onClose={() => setSheetOpen(false)}>{purchaseForm}</PurchaseSheet>
      ) : null}
    </div>
  );
}

const primaryButton =
  "flex h-[52px] items-center justify-center bg-[#212121] text-[15px] font-semibold tracking-[-0.2px] text-white transition-colors hover:bg-black disabled:opacity-50";
const secondaryButton =
  "flex h-[52px] items-center justify-center border border-[#212121] bg-white text-[15px] font-medium tracking-[-0.2px] text-[#212121] transition-colors hover:bg-black/[0.04] disabled:opacity-50";

// ────────────────────────────────────────────────────────────────
// 파생 헬퍼
// ────────────────────────────────────────────────────────────────

function sumOptionDelta(groups: OptionGroup[], selection: SelectionMap): number {
  return groups.reduce((sum, group) => {
    const chosen = group.choices.find((c) => c.id === selection[group.id]);
    return sum + (chosen?.priceDelta ?? 0);
  }, 0);
}

function allGroupsChosen(groups: OptionGroup[], selection: SelectionMap): boolean {
  return groups.length > 0 && groups.every((g) => selection[g.id]);
}

function describeSelection(
  groups: OptionGroup[],
  selection: SelectionMap,
): string {
  return groups
    .map((g) => {
      const chosen = g.choices.find((c) => c.id === selection[g.id]);
      return chosen ? `${g.label}: ${chosen.label}` : null;
    })
    .filter(Boolean)
    .join(" · ");
}

// ────────────────────────────────────────────────────────────────
// 서브 컴포넌트
// ────────────────────────────────────────────────────────────────

function SpecRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start">
      {/* 모바일: 라벨 폭을 줄여 값 열이 정가(취소선) 시작점 부근에 오도록 맞추고 글씨를 한 단계 줄인다. */}
      <dt className="w-[70px] flex-none text-[13px] font-medium leading-[20px] tracking-[-0.2px] text-[#545454] md:w-[90px] md:text-[14px] md:leading-[22.5px]">
        {label}
      </dt>
      <dd className="flex flex-col text-[13px] font-normal leading-[20px] tracking-[-0.2px] text-[#545454] md:text-[14px] md:leading-[22.5px]">
        {children}
      </dd>
    </div>
  );
}

/** 상세 페이지의 모바일/PC 경계(lg). 이보다 좁으면 갤러리와 패널이 세로로 쌓인다. */
const DESKTOP_QUERY = "(min-width: 1024px)";

/** 서버 렌더와 첫 하이드레이션에서는 false(모바일)로 본다. */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** 요소가 화면에 조금이라도 보이는지. 측정 전에는 보인다고 본다(PC 구매 바가 처음에 깜빡이지 않게). */
function useInView(ref: React.RefObject<HTMLElement | null>): boolean {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

function StatusMessage({ status, className }: { status: Status; className?: string }) {
  if (status.kind === "idle") return null;
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "mt-4 text-[13px]",
        status.kind === "success" ? "text-[#2DB400]" : "text-brand-primary",
        className,
      )}
    >
      {status.message}
    </p>
  );
}

/** "￣￣￣" "―――" 처럼 구분선으로 쓴 줄. 글자로 두면 좁은 화면에서 두 줄로 꺾여 얇은 선으로 바꿔 그린다. */
const DIVIDER_LINE = /^[\s￣―—–\-_─━=~]{5,}$/;

/**
 * 상품명 아래 안내문. 상품마다 8~16줄이라 처음엔 모바일 2줄·PC 3줄 높이만 보이고 "안내 더보기"로 펼친다.
 * 내용이 그보다 짧으면 버튼을 그리지 않는다. 빈 줄은 예전 화면처럼 간격 없이 뺀다.
 */
function ProductNotice({ lines }: { lines: string[] }) {
  const visible = lines.filter((line) => line.trim());
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible.length, expanded]);

  if (visible.length === 0) return null;

  return (
    <div className="mt-4 border border-[#E1D9D6] bg-white px-3.5 py-3 md:mt-6 md:px-4 md:py-3.5">
      <div
        ref={ref}
        className={cn(
          "text-[13px] leading-[20px] tracking-[-0.3px] text-[#666] [overflow-wrap:anywhere] md:text-[14px] md:leading-[22px]",
          !expanded && "max-h-[40px] overflow-hidden md:max-h-[44px] lg:max-h-[66px]",
        )}
      >
        {visible.map((line, i) =>
          DIVIDER_LINE.test(line) ? (
            <div key={i} aria-hidden className="my-2.5 h-px bg-[#E1D9D6]" />
          ) : (
            <p key={i}>{line}</p>
          ),
        )}
      </div>
      {overflows || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-1.5 flex items-center gap-1 text-[12.5px] font-semibold text-brand-secondary md:text-[13px]"
        >
          {expanded ? "접기" : "안내 더보기"}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden className={expanded ? "rotate-180" : ""}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

/**
 * 화면 아래 고정 구매 바.
 * - 모바일: 장바구니 · 바로 구매하기. 누르면 옵션 창이 올라온다.
 * - PC: 상품명·가격 + 버튼. 패널의 구매 버튼이 화면에 보이는 동안은 아래로 숨는다.
 * 바에 가려지지 않도록 SiteFrame 의 bottomBarSpace 로 페이지 아래에 같은 높이의 여백을 둔다.
 */
function BuyBar({
  product,
  basePrice,
  discountRate,
  hidden,
  pending,
  status,
  onAction,
}: {
  product: ProductDetail;
  basePrice: number;
  discountRate: number;
  hidden: boolean;
  pending: boolean;
  status: Status;
  onAction: (action: "buy" | "cart") => void;
}) {
  return (
    <div
      inert={hidden}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-[#E1D9D6] bg-white pb-[env(safe-area-inset-bottom)] transition-transform duration-200",
        hidden && "translate-y-full",
      )}
    >
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-2 px-4 py-2.5 md:px-8 lg:gap-3 lg:py-3 xl:px-0">
        <div className="mr-auto hidden min-w-0 flex-col lg:flex">
          <span className="truncate text-[15px] font-medium text-black">{product.name}</span>
          {status.kind !== "idle" ? (
            <StatusMessage status={status} className="mt-0" />
          ) : (
            <span className="flex items-baseline gap-1.5 text-[15px] tracking-[-0.2px]">
              {discountRate > 0 ? <span className="font-bold text-brand-primary">{discountRate}%</span> : null}
              <span className="font-bold text-black">{formatKRW(basePrice)}</span>
            </span>
          )}
        </div>
        {product.soldOut ? (
          <button type="button" disabled className={cn(primaryButton, "h-[50px] flex-1 lg:w-[220px] lg:flex-none")}>
            품절
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onAction("cart")}
              disabled={pending}
              className={cn(secondaryButton, "h-[50px] flex-1 lg:w-[180px] lg:flex-none")}
            >
              장바구니
            </button>
            <button
              type="button"
              onClick={() => onAction("buy")}
              disabled={pending}
              className={cn(primaryButton, "h-[50px] flex-[2] lg:w-[220px] lg:flex-none")}
            >
              바로 구매하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** 모바일 옵션 창. 아래에서 올라오고, 바깥(어두운 곳)·ESC·닫기 버튼으로 닫는다. 열려 있는 동안 본문 스크롤을 잠근다. */
function PurchaseSheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="옵션 선택" className="fixed inset-0 z-[45]">
      <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-black/45" />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col overflow-y-auto overscroll-contain rounded-t-[18px] bg-white px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-2.5 outline-none"
      >
        <div className="relative mb-4 flex justify-center">
          <span aria-hidden className="h-1 w-10 rounded-full bg-[#D8D0CE]" />
          <button
            type="button"
            onClick={onClose}
            aria-label="옵션 창 닫기"
            className="absolute -top-1 right-0 p-1.5 text-ink-subtle hover:text-black"
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
