import type { MyReview, ReviewThumbnail } from "@/types/review";

import { apiFetch } from "./client";

/** 메인에 노출할 대표 리뷰 썸네일. 빌드 시점에 호출한다. */
export async function listFeaturedReviews(
  params: { limit?: number } = {},
): Promise<ReviewThumbnail[]> {
  const { limit = 4 } = params;
  return apiFetch<ReviewThumbnail[]>(`/api/reviews/featured?limit=${limit}`);
}

/** 후기 작성 대상(구매했지만 아직 후기를 쓰지 않은 주문 상품) 선택지. */
export type ReviewableProduct = {
  orderItemId: string;
  slug: string;
  name: string;
  option?: string;
};

export async function listReviewableProducts(): Promise<ReviewableProduct[]> {
  return apiFetch<ReviewableProduct[]>("/api/me/reviewable-products", { auth: true });
}

export async function listMyReviews(): Promise<MyReview[]> {
  return apiFetch<MyReview[]>("/api/me/reviews", { auth: true });
}

export type CreateReviewInput = {
  orderItemId: string;
  rating: number;
  content: string;
  photos: File[];
};

/** 후기 저장. 사진이 있어 multipart 로 보낸다. */
export async function createReview(input: CreateReviewInput): Promise<MyReview> {
  const form = new FormData();
  form.set("orderItemId", input.orderItemId);
  form.set("rating", String(input.rating));
  form.set("content", input.content);
  input.photos.forEach((photo) => form.append("photos", photo));
  return apiFetch<MyReview>("/api/reviews", { method: "POST", auth: true, body: form });
}
