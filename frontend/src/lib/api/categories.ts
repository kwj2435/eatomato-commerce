import type { CategoryKey, SubcategoryKey } from "@/types/product";

import { apiFetch } from "./client";

export type CategoryTree = Array<{
  slug: CategoryKey;
  label: string;
  /** 첫 항목은 항상 { slug: null, label: "All" } */
  subcategories: Array<{ slug: SubcategoryKey | null; label: string }>;
}>;

export const listCategories = () => apiFetch<CategoryTree>("/api/categories");
