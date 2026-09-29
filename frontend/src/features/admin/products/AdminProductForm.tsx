"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createAdminProduct, getAdminProduct, listAllAdminProducts, updateAdminProduct } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { listCategories, type CategoryTree } from "@/lib/api/categories";
import type { AdminOptionGroup, AdminProduct, AdminProductInput, AdminProductSummary } from "@/types/admin";
import type { ProductBadge } from "@/types/product";

import { ImageInput } from "../ImageInput";
import { Button, Card, Field, Notice, PageHeader, inputClass, textareaClass } from "../ui";

const BADGES: ProductBadge[] = ["NEW", "BEST", "SALE"];

/** 새 상품 기본값. 배송/제작 안내는 기존 상품과 같은 문구로 시작한다. */
const DEFAULT_NOTICE = [
  "eatomato의 모든 제품은 주문 후 제작 상품입니다.",
  "주문 확인 후 순차적으로 제작되며",
  "제작기간은 평균 3~7일(영업일 기준) 정도 소요됩니다. (주말 및 공휴일 제외)",
  "제작 후 배송기간은 추가 3~5일 소요되며,",
  "택배사의 배송 상황에 따라 추가 배송 기간이 발생할 수 있습니다.",
].join("\n");

const EMPTY: AdminProductInput = {
  slug: "",
  name: "",
  optionSummary: "",
  price: 0,
  salePrice: null,
  imageUrl: "",
  hoverImageUrl: "",
  categoryCode: "phone-case",
  subcategoryCode: "",
  rewardRate: 3,
  stockQuantity: null,
  noticeText: DEFAULT_NOTICE,
  shippingText: DEFAULT_NOTICE,
  visible: true,
  badges: [],
  detailImages: [],
  optionGroups: [],
  relatedProductIds: [],
};

function toInput(p: AdminProduct): AdminProductInput {
  // 판매량·등록일 같은 읽기 전용 값은 폼(=요청 본문)에 싣지 않는다.
  return {
    slug: p.slug,
    name: p.name,
    optionSummary: p.optionSummary ?? "",
    price: p.price,
    salePrice: p.salePrice,
    imageUrl: p.imageUrl ?? "",
    hoverImageUrl: p.hoverImageUrl ?? "",
    categoryCode: p.categoryCode,
    subcategoryCode: p.subcategoryCode ?? "",
    rewardRate: p.rewardRate,
    stockQuantity: p.stockQuantity,
    noticeText: p.noticeText ?? "",
    shippingText: p.shippingText ?? "",
    visible: p.visible,
    badges: p.badges,
    detailImages: p.detailImages,
    optionGroups: p.optionGroups,
    relatedProductIds: p.relatedProductIds,
  };
}

/**
 * 상품 등록·수정 폼. `productId` 가 있으면 수정.
 *
 * 옵션 그룹의 코드(예: color)·선택지 코드(예: cream)는 장바구니 옵션 키로 쓰여서,
 * 이미 판매 중인 상품이면 라벨·추가금만 바꾸고 코드는 그대로 두는 편이 안전하다.
 */
export function AdminProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<AdminProductInput | null>(productId ? null : EMPTY);
  const [categories, setCategories] = useState<CategoryTree>([]);
  const [allProducts, setAllProducts] = useState<AdminProductSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {});
    listAllAdminProducts().then(setAllProducts).catch(() => {});
    if (productId) {
      getAdminProduct(productId)
        .then((p) => setForm(toInput(p)))
        .catch((e: unknown) => setError(errorMessage(e)));
    }
  }, [productId]);

  if (!form) {
    return error ? <Notice kind="error">{error}</Notice> : <div className="h-96 animate-pulse rounded-lg bg-black/[0.04]" />;
  }

  const set = <K extends keyof AdminProductInput>(key: K, value: AdminProductInput[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const subcategories =
    categories.find((c) => c.slug === form.categoryCode)?.subcategories.filter((s) => s.slug !== null) ?? [];

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.salePrice !== null && form.salePrice >= form.price) {
      setError("할인가는 정상가보다 낮아야 합니다.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (productId) await updateAdminProduct(productId, form);
      else await createAdminProduct(form);
      router.push("/admin/products");
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} noValidate>
      <PageHeader
        title={productId ? "상품 수정" : "상품 등록"}
        actions={
          <>
            {productId ? (
              <Link
                href={`/products/${form.slug}`}
                target="_blank"
                className="inline-flex h-10 items-center rounded-md border border-black/15 bg-white px-4 text-[14px]"
              >
                스토어에서 보기
              </Link>
            ) : null}
            <Link href="/admin/products" className="inline-flex h-10 items-center rounded-md border border-black/15 bg-white px-4 text-[14px]">
              목록
            </Link>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "저장 중…" : "저장"}
            </Button>
          </>
        }
      />

      {error ? (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <Card title="기본 정보">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="상품명" htmlFor="p-name" className="md:col-span-2">
                <input id="p-name" required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
              </Field>
              <Field label="URL (slug)" htmlFor="p-slug" hint="영문 소문자·숫자·하이픈. 상품 주소 /products/{slug} 가 됩니다.">
                <input
                  id="p-slug"
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  className={inputClass}
                />
              </Field>
              <Field label="옵션 요약" htmlFor="p-optsum" hint="리스트 카드에 나오는 문구. 예: 옵션 | 맥세이프">
                <input id="p-optsum" value={form.optionSummary} onChange={(e) => set("optionSummary", e.target.value)} className={inputClass} />
              </Field>
              <Field label="카테고리" htmlFor="p-cat">
                <select
                  id="p-cat"
                  value={form.categoryCode}
                  onChange={(e) => setForm({ ...form, categoryCode: e.target.value, subcategoryCode: "" })}
                  className={inputClass}
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="하위 카테고리" htmlFor="p-sub">
                <select
                  id="p-sub"
                  value={form.subcategoryCode}
                  onChange={(e) => set("subcategoryCode", e.target.value)}
                  disabled={subcategories.length === 0}
                  className={inputClass}
                >
                  <option value="">없음</option>
                  {subcategories.map((s) => (
                    <option key={s.slug} value={s.slug ?? ""}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="정상가 (원)" htmlFor="p-price">
                <input
                  id="p-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => set("price", Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="할인가 (원)" htmlFor="p-sale" hint="비우면 할인 없음">
                <input
                  id="p-sale"
                  type="number"
                  min={0}
                  value={form.salePrice ?? ""}
                  onChange={(e) => set("salePrice", e.target.value === "" ? null : Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="적립률 (%)" htmlFor="p-reward">
                <input
                  id="p-reward"
                  type="number"
                  min={0}
                  max={100}
                  value={form.rewardRate}
                  onChange={(e) => set("rewardRate", Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="재고" htmlFor="p-stock" hint="비워 두면 재고를 관리하지 않습니다(무제한). 0 이면 품절로 표시되고 구매가 막힙니다.">
                <div className="flex items-center gap-3">
                  <input
                    id="p-stock"
                    type="number"
                    min={0}
                    placeholder="무제한"
                    value={form.stockQuantity ?? ""}
                    onChange={(e) => set("stockQuantity", e.target.value === "" ? null : Math.max(0, Number(e.target.value)))}
                    className={inputClass}
                  />
                  {form.stockQuantity === 0 ? <span className="flex-none text-[13px] font-bold text-brand-primary">품절</span> : null}
                </div>
              </Field>
              <Field label="배지·노출">
                <div className="flex h-10 flex-wrap items-center gap-4 text-[14px]">
                  {BADGES.map((badge) => (
                    <label key={badge} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={form.badges.includes(badge)}
                        onChange={(e) =>
                          set("badges", e.target.checked ? [...form.badges, badge] : form.badges.filter((b) => b !== badge))
                        }
                      />
                      {badge}
                    </label>
                  ))}
                  <label className="ml-auto flex items-center gap-1.5 font-medium">
                    <input type="checkbox" checked={form.visible} onChange={(e) => set("visible", e.target.checked)} />
                    스토어에 노출
                  </label>
                </div>
              </Field>
            </div>
          </Card>

          <OptionGroupsEditor groups={form.optionGroups} onChange={(groups) => set("optionGroups", groups)} />

          <Card title="안내 문구">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="상품명 아래 안내" htmlFor="p-notice" hint="줄마다 한 문단">
                <textarea id="p-notice" rows={6} value={form.noticeText} onChange={(e) => set("noticeText", e.target.value)} className={textareaClass} />
              </Field>
              <Field label="배송 안내" htmlFor="p-ship" hint="상세 하단 SHIPPING 섹션">
                <textarea id="p-ship" rows={6} value={form.shippingText} onChange={(e) => set("shippingText", e.target.value)} className={textareaClass} />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="이미지">
            <div className="space-y-4">
              <Field label="대표 이미지" htmlFor="p-img">
                <ImageInput id="p-img" category="products" value={form.imageUrl} onChange={(url) => set("imageUrl", url)} />
              </Field>
              <Field label="마우스 오버 이미지" htmlFor="p-hover">
                <ImageInput id="p-hover" category="products" value={form.hoverImageUrl} onChange={(url) => set("hoverImageUrl", url)} />
              </Field>
              <div>
                <p className="mb-1.5 text-[13px] font-medium text-ink-muted">상세 이미지 (DETAILS 섹션, 위에서부터 순서대로)</p>
                <div className="space-y-3">
                  {form.detailImages.map((url, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <ImageInput
                          category="products"
                          value={url}
                          onChange={(next) => set("detailImages", form.detailImages.map((u, j) => (j === i ? next : u)))}
                        />
                      </div>
                      <Button size="sm" variant="ghost" aria-label="위로" disabled={i === 0} onClick={() => set("detailImages", move(form.detailImages, i, -1))}>
                        ↑
                      </Button>
                      <Button size="sm" variant="ghost" aria-label="삭제" onClick={() => set("detailImages", form.detailImages.filter((_, j) => j !== i))}>
                        ✕
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" onClick={() => set("detailImages", [...form.detailImages, ""])}>
                    상세 이미지 추가
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="함께 구매 (BETTER TOGETHER)">
            <p className="mb-2 text-[12px] text-ink-subtle">상세 페이지에 같이 보여 줄 상품을 최대 6개 고릅니다.</p>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-black/10 p-2">
              {allProducts
                .filter((p) => p.id !== productId)
                .map((p) => {
                  const checked = form.relatedProductIds.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-2 rounded px-1 py-1 text-[13px] hover:bg-black/[0.03]">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && form.relatedProductIds.length >= 6}
                        onChange={(e) =>
                          set(
                            "relatedProductIds",
                            e.target.checked
                              ? [...form.relatedProductIds, p.id]
                              : form.relatedProductIds.filter((id) => id !== p.id),
                          )
                        }
                      />
                      <span className="truncate">{p.name}</span>
                      {!p.visible ? <span className="text-[11px] text-ink-subtle">(숨김)</span> : null}
                    </label>
                  );
                })}
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}

function move<T>(list: T[], index: number, delta: number): T[] {
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(index + delta, 0, item);
  return next;
}

/** 옵션 그룹 편집기. 그룹마다 선택지 하나를 고르게 되며, 선택지별 추가금을 둘 수 있다. */
function OptionGroupsEditor({
  groups,
  onChange,
}: {
  groups: AdminOptionGroup[];
  onChange: (groups: AdminOptionGroup[]) => void;
}) {
  const update = (i: number, group: AdminOptionGroup) => onChange(groups.map((g, j) => (j === i ? group : g)));

  return (
    <Card
      title="옵션"
      actions={
        <Button
          size="sm"
          onClick={() =>
            onChange([...groups, { code: `option${groups.length + 1}`, label: "", choices: [{ code: "basic", label: "", priceDelta: 0 }] }])
          }
        >
          옵션 그룹 추가
        </Button>
      }
    >
      {groups.length === 0 ? (
        <p className="text-[13px] text-ink-subtle">옵션이 없으면 고객이 옵션 선택 없이 담을 수 없습니다. 최소 한 그룹을 추가해 주세요.</p>
      ) : null}
      <div className="space-y-4">
        {groups.map((group, i) => (
          <div key={i} className="rounded-md border border-black/10 p-3">
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <input
                aria-label="옵션 그룹 이름"
                placeholder="그룹 이름 (예: 색상)"
                value={group.label}
                onChange={(e) => update(i, { ...group, label: e.target.value })}
                className={inputClass}
              />
              <input
                aria-label="옵션 그룹 코드"
                placeholder="코드 (예: color)"
                value={group.code}
                onChange={(e) => update(i, { ...group, code: toCode(e.target.value) })}
                className={inputClass}
              />
              <Button variant="ghost" onClick={() => onChange(groups.filter((_, j) => j !== i))}>
                그룹 삭제
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {group.choices.map((choice, ci) => {
                const setChoice = (next: typeof choice) =>
                  update(i, { ...group, choices: group.choices.map((c, cj) => (cj === ci ? next : c)) });
                return (
                  <div key={ci} className="grid gap-2 md:grid-cols-[1.4fr_1fr_120px_auto]">
                    <input
                      aria-label="선택지 이름"
                      placeholder="선택지 (예: 맥세이프 (+4,000원))"
                      value={choice.label}
                      onChange={(e) => setChoice({ ...choice, label: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      aria-label="선택지 코드"
                      placeholder="코드 (예: macsafe)"
                      value={choice.code}
                      onChange={(e) => setChoice({ ...choice, code: toCode(e.target.value) })}
                      className={inputClass}
                    />
                    <input
                      aria-label="추가금"
                      type="number"
                      value={choice.priceDelta}
                      onChange={(e) => setChoice({ ...choice, priceDelta: Number(e.target.value) })}
                      className={inputClass}
                    />
                    <Button
                      variant="ghost"
                      disabled={group.choices.length <= 1}
                      onClick={() => update(i, { ...group, choices: group.choices.filter((_, cj) => cj !== ci) })}
                    >
                      삭제
                    </Button>
                  </div>
                );
              })}
              <Button
                size="sm"
                onClick={() =>
                  update(i, {
                    ...group,
                    choices: [...group.choices, { code: `choice${group.choices.length + 1}`, label: "", priceDelta: 0 }],
                  })
                }
              >
                선택지 추가
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function toCode(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 40);
}
