"use client";

import { useSearchParams } from "next/navigation";

import { Notice } from "../ui";
import { AdminProductForm } from "./AdminProductForm";

/**
 * `/admin/products/edit?id=123`.
 * 정적 export(GitHub Pages)에서도 돌도록 동적 세그먼트 대신 쿼리로 상품을 고른다.
 */
export function AdminProductEdit() {
  const id = useSearchParams().get("id");
  if (!id) return <Notice kind="error">수정할 상품이 지정되지 않았습니다.</Notice>;
  // key: 다른 상품으로 옮겨 가면 폼 상태를 새로 만든다.
  return <AdminProductForm key={id} productId={id} />;
}
