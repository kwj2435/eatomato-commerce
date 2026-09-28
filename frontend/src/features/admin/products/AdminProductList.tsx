"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { deleteAdminProduct, listAdminProducts, setAdminProductVisible } from "@/lib/api/admin";
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

        {!data ? (
          <div className="h-60 animate-pulse rounded-md bg-black/[0.04]" />
        ) : data.content.length === 0 ? (
          <Empty>상품이 없습니다.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>상품</th>
                  <th className={thClass}>카테고리</th>
                  <th className={`${thClass} text-right`}>판매가</th>
                  <th className={`${thClass} text-right`}>판매량</th>
                  <th className={thClass}>노출</th>
                  <th className={thClass}>
                    <span className="sr-only">관리</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((p) => (
                  <tr key={p.id}>
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
                        <span className="block text-[12px] text-ink-subtle line-through">{formatKRW(p.price)}</span>
                      ) : null}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`}>{p.salesCount.toLocaleString("ko-KR")}</td>
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
