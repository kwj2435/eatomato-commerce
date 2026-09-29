"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  deleteAdminProduct,
  listAdminProducts,
  setAdminProductStock,
  setAdminProductVisible,
  setAdminProductsDiscount,
} from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { listCategories, type CategoryTree } from "@/lib/api/categories";
import { formatKRW } from "@/lib/utils/format";
import type { AdminProductSummary, Page } from "@/types/admin";

import { Button, Card, Chip, Empty, Notice, PageHeader, Pagination, inputClass, tableClass, tdClass, thClass } from "../ui";

export function AdminProductList() {
  const [categories, setCategories] = useState<CategoryTree>([]);
  const [q, setQ] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<AdminProductSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // 선택은 페이지를 넘겨도 유지한다(여러 페이지 상품을 한 번에 조정).
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    listAdminProducts({ q: keyword, category, page })
      .then(setData)
      .catch((e: unknown) => setError(errorMessage(e)));
  }, [keyword, category, page]);

  useEffect(load, [load]);
  useEffect(() => {
    listCategories().then(setCategories).catch(() => {});
  }, []);

  const categoryLabel = (code: string) => categories.find((c) => c.slug === code)?.label ?? code;

  const toggleVisible = async (product: AdminProductSummary) => {
    try {
      await setAdminProductVisible(product.id, !product.visible);
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const saveStock = async (product: AdminProductSummary, raw: string) => {
    const next = raw.trim() === "" ? null : Math.max(0, Math.floor(Number(raw)));
    if (next !== null && !Number.isFinite(next)) return;
    if (next === product.stockQuantity) return;
    try {
      const updated = await setAdminProductStock(product.id, next);
      setData((prev) => (prev ? { ...prev, content: prev.content.map((p) => (p.id === updated.id ? updated : p)) } : prev));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const pageIds = data?.content.map((p) => p.id) ?? [];
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => (allOnPageSelected ? next.delete(id) : next.add(id)));
      return next;
    });

  const applyDiscount = async (rate: number, roundingUnit: 1 | 10 | 100) => {
    const ids = [...selected];
    const what = rate === 0 ? "할인을 해제할까요?" : `정상가에서 ${rate}% 할인한 값으로 할인가를 바꿀까요?`;
    if (!window.confirm(`선택한 상품 ${ids.length}개의 ${what}\n기존 할인가는 덮어씁니다.`)) return;
    try {
      await setAdminProductsDiscount(ids, rate, roundingUnit);
      setError(null);
      setNotice(`${ids.length}개 상품의 ${rate === 0 ? "할인을 해제했습니다" : `할인율을 ${rate}%로 바꿨습니다`}.`);
      setSelected(new Set());
      load();
    } catch (e) {
      setNotice(null);
      setError(errorMessage(e));
    }
  };

  const remove = async (product: AdminProductSummary) => {
    if (!window.confirm(`'${product.name}' 상품을 삭제할까요?\n주문 내역은 남고, 장바구니에서는 빠집니다.`)) return;
    try {
      await deleteAdminProduct(product.id);
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader
        title="상품"
        description="등록·수정 내용은 스토어에 1분 안에 반영됩니다. 숨김 상품은 스토어에서 보이지 않습니다."
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center rounded-md bg-brand-deep px-4 text-[14px] font-medium text-white hover:bg-brand-secondary"
          >
            상품 등록
          </Link>
        }
      />

      <Card>
        <form
          className="mb-4 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            setKeyword(q.trim());
          }}
        >
          <select
            aria-label="카테고리"
            value={category}
            onChange={(e) => {
              setPage(0);
              setCategory(e.target.value);
            }}
            className={`${inputClass} w-40`}
          >
            <option value="">전체 카테고리</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            aria-label="상품 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="상품명 또는 slug"
            className={`${inputClass} w-64`}
          />
          <Button type="submit">검색</Button>
        </form>

        {error ? <Notice kind="error">{error}</Notice> : null}
        {notice ? <Notice kind="success">{notice}</Notice> : null}
        {selected.size > 0 ? (
          <BulkDiscountBar count={selected.size} onApply={applyDiscount} onClear={() => setSelected(new Set())} />
        ) : null}

        {!data ? (
          <div className="h-60 animate-pulse rounded-md bg-black/[0.04]" />
        ) : data.content.length === 0 ? (
          <Empty>상품이 없습니다.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={`${thClass} w-8`}>
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={togglePage}
                      aria-label="이 페이지 상품 모두 선택"
                    />
                  </th>
                  <th className={thClass}>상품</th>
                  <th className={thClass}>카테고리</th>
                  <th className={`${thClass} text-right`}>판매가</th>
                  <th className={`${thClass} text-right`}>판매량</th>
                  <th className={thClass}>재고</th>
                  <th className={thClass}>노출</th>
                  <th className={thClass}>
                    <span className="sr-only">관리</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((p) => (
                  <tr key={p.id} className={selected.has(p.id) ? "bg-brand-tint/40" : undefined}>
                    <td className={tdClass}>
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelected(p.id)}
                        aria-label={`${p.name} 선택`}
                      />
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-10 flex-none overflow-hidden rounded bg-black/[0.04]">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- 관리자 목록 썸네일
                            <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/edit?id=${p.id}`}
                            className="font-medium text-ink-primary hover:underline"
                          >
                            {p.name}
                          </Link>
                          <p className="text-[12px] text-ink-subtle">
                            /{p.slug}
                            {p.badges.length ? ` · ${p.badges.join(" · ")}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>{categoryLabel(p.categoryCode)}</td>
                    <td className={`${tdClass} whitespace-nowrap text-right tabular-nums`}>
                      {formatKRW(p.salePrice ?? p.price)}
                      {p.salePrice !== null ? (
                        <span className="block text-[12px] text-ink-subtle">
                          <span className="mr-1 font-medium text-brand-primary">{discountRate(p)}%</span>
                          <span className="line-through">{formatKRW(p.price)}</span>
                        </span>
                      ) : null}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`}>{p.salesCount.toLocaleString("ko-KR")}</td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-1.5">
                        {/* 칸을 벗어나거나 Enter 를 누르면 저장. 비우면 재고 관리 안 함(무제한). */}
                        <input
                          key={`${p.id}-${p.stockQuantity}`}
                          type="number"
                          min={0}
                          defaultValue={p.stockQuantity ?? ""}
                          placeholder="무제한"
                          aria-label={`${p.name} 재고`}
                          onBlur={(e) => saveStock(p, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          }}
                          className="h-8 w-20 rounded-md border border-black/15 px-2 text-right text-[13px] tabular-nums"
                        />
                        {p.soldOut ? <Chip tone="brand">품절</Chip> : null}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <button type="button" onClick={() => toggleVisible(p)} title="클릭해서 노출/숨김 전환">
                        <Chip tone={p.visible ? "brand" : "muted"}>{p.visible ? "노출" : "숨김"}</Chip>
                      </button>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-right`}>
                      <Link
                        href={`/admin/products/edit?id=${p.id}`}
                        className="mr-3 text-[13px] text-ink-muted hover:underline"
                      >
                        수정
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(p)}
                        className="text-[13px] text-brand-primary hover:underline"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data ? <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} /> : null}
      </Card>
    </>
  );
}

/** 목록에 보이는 할인율(정상가 대비, 반올림). */
function discountRate(p: AdminProductSummary): number {
  return p.salePrice === null || p.price === 0 ? 0 : Math.round((1 - p.salePrice / p.price) * 100);
}

const ROUNDING_UNITS = [
  { value: 1, label: "1원 단위" },
  { value: 10, label: "10원 단위 절사" },
  { value: 100, label: "100원 단위 절사" },
] as const;

/** 선택한 상품이 있을 때 목록 위에 뜨는 일괄 할인 바. */
function BulkDiscountBar({
  count,
  onApply,
  onClear,
}: {
  count: number;
  onApply: (rate: number, roundingUnit: 1 | 10 | 100) => void;
  onClear: () => void;
}) {
  const [rate, setRate] = useState("");
  const [unit, setUnit] = useState<1 | 10 | 100>(10);
  const value = Number(rate);
  const valid = rate.trim() !== "" && Number.isInteger(value) && value >= 1 && value <= 95;

  return (
    <div className="my-3 flex flex-wrap items-center gap-2 rounded-md border border-brand-primary/30 bg-brand-tint/40 px-3 py-2 text-[13px]">
      <span className="font-medium text-ink-primary">{count}개 선택</span>
      <span className="text-ink-subtle">·</span>
      <label className="flex items-center gap-1.5">
        할인율
        <input
          type="number"
          min={1}
          max={95}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && valid) onApply(value, unit);
          }}
          placeholder="1~95"
          className="h-8 w-20 rounded-md border border-black/15 bg-white px-2 text-right tabular-nums"
        />
        %
      </label>
      <select
        aria-label="할인가 절사 단위"
        value={unit}
        onChange={(e) => setUnit(Number(e.target.value) as 1 | 10 | 100)}
        className="h-8 rounded-md border border-black/15 bg-white px-2"
      >
        {ROUNDING_UNITS.map((u) => (
          <option key={u.value} value={u.value}>
            {u.label}
          </option>
        ))}
      </select>
      <Button size="sm" variant="primary" disabled={!valid} onClick={() => onApply(value, unit)}>
        할인 적용
      </Button>
      <Button size="sm" variant="danger" onClick={() => onApply(0, 1)}>
        할인 해제
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear} className="ml-auto">
        선택 해제
      </Button>
      <p className="w-full text-[12px] text-ink-subtle">할인가 = 정상가 × (100 − 할인율)%. 옵션 추가금에는 할인이 붙지 않습니다.</p>
    </div>
  );
}
