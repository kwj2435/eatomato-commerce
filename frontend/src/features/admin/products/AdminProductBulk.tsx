"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { createAdminProduct, getAdminProduct, listAllAdminProducts } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { listCategories, type CategoryTree } from "@/lib/api/categories";
import { cn } from "@/lib/utils/cn";
import type { AdminProductInput, AdminProductSummary } from "@/types/admin";

import { Button, Card, Chip, Empty, Notice, PageHeader, inputClass, tableClass, tdClass, thClass } from "../ui";
import { AdminProductFields } from "./AdminProductFields";
import { EMPTY_PRODUCT, copyAsNew, validateProduct } from "./product-input";

type Draft = {
  key: number;
  form: AdminProductInput;
  status: "draft" | "saving" | "done" | "error";
  message?: string;
  /** 등록에 성공하면 새 상품 id(수정 화면 링크용). */
  createdId?: string;
  /** 기존 상품을 불러와 만든 초안이면 원본 상품명. */
  sourceName?: string;
};

/**
 * 상품 일괄 등록. 초안을 여러 개 만들어 한 번에 등록한다.
 * - 빈 초안을 추가하거나, 기존 상품을 불러와(옵션·이미지·안내 문구까지 복사) 고친 뒤 새 상품으로 등록할 수 있다.
 * - 위 표에서 상품명·URL·가격·재고를 바로 고치고, 행을 고르면 아래에서 전체 항목을 편집한다.
 * - 등록은 한 개씩 차례로 보내고, 실패한 초안은 사유와 함께 남겨 고친 뒤 다시 등록할 수 있다.
 */
export function AdminProductBulk() {
  const [categories, setCategories] = useState<CategoryTree>([]);
  const [allProducts, setAllProducts] = useState<AdminProductSummary[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedKey, setSelectedKey] = useState<number | null>(null);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const nextKey = useRef(1);

  const reloadProducts = () => listAllAdminProducts().then(setAllProducts).catch(() => {});

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {});
    reloadProducts();
  }, []);

  const pending = drafts.filter((d) => d.status !== "done");

  // 등록하지 않은 초안이 있으면 페이지를 떠나기 전에 묻는다.
  useEffect(() => {
    if (pending.length === 0) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pending.length]);

  const addDrafts = (items: Array<Pick<Draft, "form" | "sourceName">>) => {
    const added = items.map((item) => ({ ...item, key: nextKey.current++, status: "draft" as const }));
    setDrafts((prev) => [...prev, ...added]);
    if (added.length > 0) setSelectedKey(added[added.length - 1].key);
  };

  const updateDraft = (key: number, form: AdminProductInput) =>
    setDrafts((prev) =>
      prev.map((d) => (d.key === key ? { ...d, form, status: d.status === "done" ? d.status : "draft", message: undefined } : d)),
    );

  const patchForm = (key: number, patch: Partial<AdminProductInput>) => {
    const draft = drafts.find((d) => d.key === key);
    if (draft) updateDraft(key, { ...draft.form, ...patch });
  };

  const duplicate = (draft: Draft) =>
    addDrafts([{ form: { ...draft.form, slug: `${draft.form.slug}-2`.slice(0, 80) }, sourceName: draft.sourceName }]);

  const remove = (key: number) => {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
    if (selectedKey === key) setSelectedKey(null);
  };

  const importProducts = async (ids: string[]) => {
    setMessage(null);
    const results = await Promise.allSettled(ids.map((id) => getAdminProduct(id)));
    const loaded = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    addDrafts(loaded.map((p) => ({ form: copyAsNew(p), sourceName: p.name })));
    const failed = results.length - loaded.length;
    if (failed > 0) setMessage({ kind: "error", text: `${failed}개 상품을 불러오지 못했습니다.` });
  };

  const saveAll = async () => {
    setMessage(null);
    const targets = drafts.filter((d) => d.status !== "done");
    if (targets.length === 0) return;

    // 화면에서 잡을 수 있는 오류(빈 상품명, 초안끼리 겹치는 URL 등)는 보내기 전에 표시한다.
    const slugCount = new Map<string, number>();
    targets.forEach((d) => slugCount.set(d.form.slug, (slugCount.get(d.form.slug) ?? 0) + 1));
    const invalid = new Map<number, string>();
    targets.forEach((d) => {
      const reason =
        validateProduct(d.form) ?? ((slugCount.get(d.form.slug) ?? 0) > 1 ? "다른 초안과 URL(slug)이 겹칩니다." : null);
      if (reason) invalid.set(d.key, reason);
    });
    if (invalid.size > 0) {
      setDrafts((prev) => prev.map((d) => (invalid.has(d.key) ? { ...d, status: "error", message: invalid.get(d.key) } : d)));
      setMessage({ kind: "error", text: `${invalid.size}개 초안에 고칠 내용이 있습니다. 표의 사유를 확인해 주세요.` });
      return;
    }

    setSaving(true);
    let done = 0;
    let failed = 0;
    for (const draft of targets) {
      setDrafts((prev) => prev.map((d) => (d.key === draft.key ? { ...d, status: "saving", message: undefined } : d)));
      try {
        const created = await createAdminProduct(draft.form);
        done += 1;
        setDrafts((prev) => prev.map((d) => (d.key === draft.key ? { ...d, status: "done", createdId: created.id } : d)));
      } catch (e) {
        failed += 1;
        setDrafts((prev) => prev.map((d) => (d.key === draft.key ? { ...d, status: "error", message: errorMessage(e) } : d)));
      }
    }
    setSaving(false);
    reloadProducts();
    setMessage(
      failed === 0
        ? { kind: "success", text: `${done}개 상품을 등록했습니다. 스토어에는 1분 안에 반영됩니다.` }
        : { kind: "error", text: `${done}개 등록, ${failed}개 실패. 실패한 초안의 사유를 확인해 주세요.` },
    );
  };

  const clearDone = () => setDrafts((prev) => prev.filter((d) => d.status !== "done"));

  const selected = drafts.find((d) => d.key === selectedKey) ?? null;

  return (
    <>
      <PageHeader
        title="상품 일괄 등록"
        description="여러 상품을 한 번에 등록합니다. 기존 상품을 불러와 옵션·이미지·안내 문구를 그대로 복사한 뒤 고쳐서 새 상품으로 등록할 수도 있습니다."
        actions={
          <>
            <Link href="/admin/products" className="inline-flex h-10 items-center rounded-md border border-black/15 bg-white px-4 text-[14px]">
              목록
            </Link>
            <Button variant="primary" disabled={saving || pending.length === 0} onClick={saveAll}>
              {saving ? "등록 중…" : `${pending.length}개 모두 등록`}
            </Button>
          </>
        }
      />

      {message ? (
        <div className="mb-4">
          <Notice kind={message.kind}>{message.text}</Notice>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card
          title={`초안 ${drafts.length}개`}
          actions={
            <>
              {drafts.some((d) => d.status === "done") ? (
                <Button size="sm" variant="ghost" onClick={clearDone}>
                  등록 완료 지우기
                </Button>
              ) : null}
              <Button size="sm" onClick={() => addDrafts([{ form: EMPTY_PRODUCT }])}>
                빈 상품 추가
              </Button>
            </>
          }
        >
          {drafts.length === 0 ? (
            <Empty>빈 상품을 추가하거나, 오른쪽에서 기존 상품을 불러와 시작하세요.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>#</th>
                    <th className={thClass}>상품명</th>
                    <th className={thClass}>URL (slug)</th>
                    <th className={thClass}>정상가</th>
                    <th className={thClass}>할인가</th>
                    <th className={thClass}>재고</th>
                    <th className={thClass}>상태</th>
                    <th className={thClass} />
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((d, i) => {
                    const locked = d.status === "done" || d.status === "saving";
                    return (
                      <tr key={d.key} className={cn(d.key === selectedKey && "bg-brand-highlight/40")}>
                        <td className={tdClass}>{i + 1}</td>
                        <td className={tdClass}>
                          <input
                            aria-label={`${i + 1}번 상품명`}
                            value={d.form.name}
                            disabled={locked}
                            onFocus={() => setSelectedKey(d.key)}
                            onChange={(e) => patchForm(d.key, { name: e.target.value })}
                            className={cn(inputClass, "min-w-[160px]")}
                          />
                          {d.sourceName ? <p className="mt-1 text-[11px] text-ink-subtle">원본: {d.sourceName}</p> : null}
                        </td>
                        <td className={tdClass}>
                          <input
                            aria-label={`${i + 1}번 URL`}
                            value={d.form.slug}
                            disabled={locked}
                            onFocus={() => setSelectedKey(d.key)}
                            onChange={(e) => patchForm(d.key, { slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                            className={cn(inputClass, "min-w-[140px]")}
                          />
                        </td>
                        <td className={tdClass}>
                          <input
                            aria-label={`${i + 1}번 정상가`}
                            type="number"
                            min={0}
                            value={d.form.price}
                            disabled={locked}
                            onFocus={() => setSelectedKey(d.key)}
                            onChange={(e) => patchForm(d.key, { price: Number(e.target.value) })}
                            className={cn(inputClass, "min-w-[100px]")}
                          />
                        </td>
                        <td className={tdClass}>
                          <input
                            aria-label={`${i + 1}번 할인가`}
                            type="number"
                            min={0}
                            placeholder="없음"
                            value={d.form.salePrice ?? ""}
                            disabled={locked}
                            onFocus={() => setSelectedKey(d.key)}
                            onChange={(e) => patchForm(d.key, { salePrice: e.target.value === "" ? null : Number(e.target.value) })}
                            className={cn(inputClass, "min-w-[100px]")}
                          />
                        </td>
                        <td className={tdClass}>
                          <input
                            aria-label={`${i + 1}번 재고`}
                            type="number"
                            min={0}
                            placeholder="무제한"
                            value={d.form.stockQuantity ?? ""}
                            disabled={locked}
                            onFocus={() => setSelectedKey(d.key)}
                            onChange={(e) =>
                              patchForm(d.key, { stockQuantity: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })
                            }
                            className={cn(inputClass, "min-w-[84px]")}
                          />
                        </td>
                        <td className={cn(tdClass, "min-w-[120px]")}>
                          <StatusChip draft={d} />
                          {d.message ? <p className="mt-1 text-[11px] text-brand-primary">{d.message}</p> : null}
                        </td>
                        <td className={cn(tdClass, "whitespace-nowrap")}>
                          {d.status === "done" && d.createdId ? (
                            <Link href={`/admin/products/edit?id=${d.createdId}`} className="text-[12px] underline">
                              수정 화면
                            </Link>
                          ) : (
                            <div className="flex gap-1">
                              <Button size="sm" variant={d.key === selectedKey ? "primary" : "secondary"} onClick={() => setSelectedKey(d.key)}>
                                상세
                              </Button>
                              <Button size="sm" variant="ghost" disabled={locked} onClick={() => duplicate(d)}>
                                복제
                              </Button>
                              <Button size="sm" variant="ghost" disabled={locked} onClick={() => remove(d.key)}>
                                삭제
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <ImportPanel products={allProducts} onImport={importProducts} />
      </div>

      {selected && selected.status !== "done" ? (
        <section aria-label="선택한 초안 상세 편집" className="mt-6">
          <h2 className="mb-3 text-[15px] font-semibold text-ink-primary">
            {drafts.indexOf(selected) + 1}번 초안 상세 · {selected.form.name || "이름 없음"}
          </h2>
          <AdminProductFields
            key={selected.key}
            form={selected.form}
            onChange={(form) => updateDraft(selected.key, form)}
            categories={categories}
            allProducts={allProducts}
            idPrefix={`d${selected.key}`}
          />
        </section>
      ) : null}
    </>
  );
}

function StatusChip({ draft }: { draft: Draft }) {
  switch (draft.status) {
    case "done":
      return <Chip tone="brand">등록 완료</Chip>;
    case "saving":
      return <Chip>등록 중…</Chip>;
    case "error":
      return <Chip tone="muted">확인 필요</Chip>;
    default:
      return <Chip tone="muted">초안</Chip>;
  }
}

/** 기존 상품 불러오기. 검색해 여러 개를 골라 초안으로 복사한다. */
function ImportPanel({ products, onImport }: { products: AdminProductSummary[]; onImport: (ids: string[]) => Promise<void> }) {
  const [q, setQ] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const keyword = q.trim().toLowerCase();
  const visible = keyword
    ? products.filter((p) => p.name.toLowerCase().includes(keyword) || p.slug.includes(keyword))
    : products;

  const run = async () => {
    setLoading(true);
    await onImport(checked);
    setChecked([]);
    setLoading(false);
  };

  return (
    <Card
      title="기존 상품 불러오기"
      actions={
        <Button size="sm" variant="primary" disabled={checked.length === 0 || loading} onClick={run}>
          {loading ? "불러오는 중…" : `${checked.length}개 불러오기`}
        </Button>
      }
    >
      <p className="mb-2 text-[12px] text-ink-subtle">
        고른 상품의 내용이 새 초안으로 복사됩니다. 원본 상품은 바뀌지 않습니다. URL은 겹치지 않게 뒤에 -copy 가 붙습니다.
      </p>
      <input
        aria-label="불러올 상품 검색"
        placeholder="상품명·URL 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className={cn(inputClass, "mb-2")}
      />
      <div className="max-h-[360px] space-y-1 overflow-y-auto rounded-md border border-black/10 p-2">
        {visible.length === 0 ? (
          <p className="px-1 py-2 text-[13px] text-ink-subtle">상품이 없습니다.</p>
        ) : (
          visible.map((p) => (
            <label key={p.id} className="flex items-center gap-2 rounded px-1 py-1 text-[13px] hover:bg-black/[0.03]">
              <input
                type="checkbox"
                checked={checked.includes(p.id)}
                onChange={(e) => setChecked((prev) => (e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)))}
              />
              <span className="h-8 w-8 flex-none overflow-hidden rounded bg-black/[0.04]">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 관리자 썸네일
                  <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{p.name}</span>
                <span className="truncate text-[11px] text-ink-subtle">{p.slug}</span>
              </span>
              {!p.visible ? <span className="text-[11px] text-ink-subtle">(숨김)</span> : null}
            </label>
          ))
        )}
      </div>
    </Card>
  );
}
