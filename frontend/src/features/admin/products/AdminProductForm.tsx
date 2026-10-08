"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createAdminProduct, getAdminProduct, listAllAdminProducts, updateAdminProduct } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { listCategories, type CategoryTree } from "@/lib/api/categories";
import type { AdminProductInput, AdminProductSummary } from "@/types/admin";

import { Button, Notice, PageHeader } from "../ui";
import { AdminProductFields } from "./AdminProductFields";
import { EMPTY_PRODUCT, toInput, validateProduct } from "./product-input";

/**
 * 상품 등록·수정 폼. `productId` 가 있으면 수정.
 *
 * 옵션 그룹의 코드(예: color)·선택지 코드(예: cream)는 장바구니 옵션 키로 쓰여서,
 * 이미 판매 중인 상품이면 라벨·추가금만 바꾸고 코드는 그대로 두는 편이 안전하다.
 */
export function AdminProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<AdminProductInput | null>(productId ? null : EMPTY_PRODUCT);
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

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const invalid = validateProduct(form);
    if (invalid) {
      setError(invalid);
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

      <AdminProductFields
        form={form}
        onChange={setForm}
        categories={categories}
        allProducts={allProducts}
        productId={productId}
      />
    </form>
  );
}
