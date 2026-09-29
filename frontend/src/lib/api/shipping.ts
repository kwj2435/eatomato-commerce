import type { ShippingPolicy } from "@/types/shipping";

import { apiFetch } from "./client";

/** 배송비 정책. 서버 렌더에서 부르면 60초 주기로 갱신된다. */
export const getShippingPolicy = () => apiFetch<ShippingPolicy>("/api/shipping-policy");

export const getAdminShippingPolicy = () => apiFetch<ShippingPolicy>("/api/admin/shipping-policy", { auth: true });

export const updateAdminShippingPolicy = (policy: Omit<ShippingPolicy, "updatedAt">) =>
  apiFetch<ShippingPolicy>("/api/admin/shipping-policy", { method: "PUT", auth: true, json: policy });
