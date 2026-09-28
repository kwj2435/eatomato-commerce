import type { Notice } from "@/types/notice";

import { apiFetch, apiFetchOrNull } from "./client";

/**
 * 공지사항 API. 빌드 시점에 받아 정적 HTML 로 만든다.
 * 정렬(고정 공지 먼저 → 등록일 내림차순)은 서버가 한다.
 */
export async function listNotices(): Promise<Notice[]> {
  return apiFetch<Notice[]>("/api/notices");
}

/** 단건 조회. 없으면 `null` 을 반환해 호출부가 404 로 처리하게 한다. */
export async function getNotice(id: string): Promise<Notice | null> {
  return apiFetchOrNull<Notice>(`/api/notices/${encodeURIComponent(id)}`);
}

/** 정적 생성용 id 목록. */
export async function listNoticeIds(): Promise<string[]> {
  return apiFetch<string[]>("/api/notices/ids");
}
