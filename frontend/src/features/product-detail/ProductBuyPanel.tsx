"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { QuantityStepper } from "@/features/cart/QuantityStepper";
import type { AddCartItemInput } from "@/lib/api/cart";
import { errorMessage } from "@/lib/api/client";
import { getProductDetail } from "@/lib/api/products";
import { hasSession } from "@/lib/store/auth-store";
import { useCartStore } from "@/lib/store/cart-store";
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
  | { kind: "login" }
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

  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const pathname = usePathname();

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
   */
  const addToCart = async (): Promise<boolean> => {
    if (!mainReady) {
      setStatus({ kind: "warn", message: "옵션을 모두 선택해 주세요." });
      return false;
    }
    if (!hasSession()) {
      setStatus({ kind: "login" });
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

  return (
    <div className="flex w-full flex-col lg:w-[499px] lg:flex-none">
      <h1 className="text-[17px] font-medium leading-[1.45] tracking-[-0.3px] text-black md:text-[20px]">
        {product.name}
      </h1>

      <div className="mt-4 flex flex-col md:mt-9">
        {product.noticeLines.map((line, i) => (
          <p
            key={i}
            className="text-[13px] font-normal leading-[20px] tracking-[-0.4px] text-[#777] md:text-[15px] md:leading-[22.5px]"
          >
            {line}
          </p>
        ))}
      </div>

      <p className="mt-10 flex items-baseline gap-2 text-[15px] tracking-[-0.2px] md:mt-14">
        <span className="text-[#545454]">{formatKRW(basePrice)}</span>
        {product.salePrice !== undefined ? (
          <span className="text-ink-subtle line-through">
            {formatKRW(product.price)}
          </span>
        ) : null}
      </p>

      <dl className="mt-[18px] flex flex-col gap-3.5">
        <SpecRow label="적립금">
          <span>{product.rewardRate}%</span>
        </SpecRow>
        {/* 관리자 > 배송비 설정값으로 만든다(예전엔 70,000원 고정 문구였다). */}
        <SpecRow label="배송비">
          {shippingPolicy.freeThreshold <= 0 ? (
            <span>무료배송</span>
          ) : (
            <span>
              {formatKRW(shippingPolicy.baseFee)} ({formatKRW(shippingPolicy.freeThreshold)} 이상 구매 시 무료)
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

      <div className="mt-[22px] flex flex-col gap-5">
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

      {mainReady ? (
        <div className="mt-6 flex items-center justify-between border border-[#E1D9D6] bg-white p-4">
          <div className="flex flex-col text-[14px] leading-[20px] tracking-[-0.2px] text-black">
            <span className="font-medium">{product.name}</span>
            <span className="text-[13px] text-[#545454]">
              {describeSelection(product.optionGroups, mainSelection)}
            </span>
          </div>
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            label="주문 수량"
          />
        </div>
      ) : null}

      <BetterTogether
        items={product.betterTogether}
        selections={btSelections}
        onChangeSelection={changeBTSelection}
      />

      <div className="flex flex-col">
        <div className="mt-[19px] h-px w-full bg-[#B0AAA9]" />

        <SummaryRow label="주문 수량" value={`${orderQuantity}개`} />
        <SummaryRow label="총 상품 금액" value={formatKRW(grandTotal)} />

        <div className="mt-7 flex gap-[21px]">
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={pending || product.soldOut}
            className="flex h-[52px] flex-1 items-center justify-center border border-[#212121] bg-brand-tint text-[15px] font-medium tracking-[-0.2px] text-[#212121] transition-colors hover:bg-black hover:text-white disabled:opacity-50"
          >
            {product.soldOut ? "품절" : "바로 구매하기"}
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={pending || product.soldOut}
            className="flex h-[52px] flex-1 items-center justify-center border border-[#C9C9C9] bg-brand-tint text-[15px] font-medium tracking-[-0.2px] text-[#545454] transition-colors hover:border-black hover:text-black disabled:opacity-50"
          >
            {product.soldOut ? "품절" : "잠깐 장바구니"}
          </button>
        </div>

        {status.kind === "login" ? (
          <p role="status" aria-live="polite" className="mt-4 text-[13px] text-brand-primary">
            장바구니는 로그인 후 이용할 수 있습니다.{" "}
            <Link
              href={`/login?next=${encodeURIComponent(pathname)}`}
              className="font-medium underline underline-offset-2"
            >
              로그인하기
            </Link>
          </p>
        ) : status.kind !== "idle" ? (
          <p
            role="status"
            aria-live="polite"
            className={
              status.kind === "success"
                ? "mt-4 text-[13px] text-[#2DB400]"
                : "mt-4 text-[13px] text-brand-primary"
            }
          >
            {status.message}
          </p>
        ) : null}

        <NaverPayWidget />
      </div>
    </div>
  );
}

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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-5 flex items-center justify-between">
      <span className="text-[14px] font-bold tracking-[-0.2px] text-ink-body">
        {label}
      </span>
      <span className="text-[14px] font-normal tracking-[-0.2px] text-[#545454]">
        {value}
      </span>
    </div>
  );
}

/**
 * 네이버페이 위젯 자리표시.
 * 실서비스에서는 네이버페이 SDK 가 이 자리에 iframe/스크립트를 렌더한다.
 */
function NaverPayWidget() {
  return (
    <div className="mt-[22px] flex w-full max-w-[260px] flex-col border-t-[3px] border-[#333] bg-white">
      <div className="flex items-center gap-2 py-2 pl-2.5 pr-2">
        <div className="flex flex-col">
          <span className="text-[11px] font-extrabold tracking-[-0.2px] text-[#2DB400]">
            NAVER
          </span>
          <span className="text-[10px] leading-[13px] tracking-[-0.4px] text-[#555]">
            네이버ID로 간편구매
          </span>
          <span className="text-[10px] leading-[13px] tracking-[-0.4px] text-[#555]">
            네이버페이
          </span>
        </div>
        <button
          type="button"
          className="flex h-[34px] flex-1 items-center justify-center gap-1 bg-[#03C75A] text-[13px] font-bold text-[#14181A]"
        >
          <span className="inline-block h-3.5 w-3.5 rounded-full bg-[#14181A] text-center leading-[14px] text-white text-[9px]">
            N
          </span>
          pay 구매
        </button>
        <button
          type="button"
          aria-label="찜"
          className="flex h-[34px] w-[34px] items-center justify-center border border-[#DDD] text-[12px] text-[#333]"
        >
          찜
        </button>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-[#EEE] py-1.5 pl-2.5 pr-2">
        <span className="truncate text-[11px] tracking-[-0.3px] text-[#999]">
          <span className="font-bold text-[#2DB400]">이벤트</span> 100% 지급! 최대 1만원 혜택…
        </span>
        <span className="flex flex-none gap-0.5">
          <span className="flex h-4 w-4 items-center justify-center border border-[#DDD] text-[9px] text-[#999]">
            ‹
          </span>
          <span className="flex h-4 w-4 items-center justify-center border border-[#DDD] text-[9px] text-[#999]">
            ›
          </span>
        </span>
      </div>
    </div>
  );
}
