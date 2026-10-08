import { apiFetch } from "./client";

/**
 * 관리자 화면에서 고칠 수 있는 사이트 문구. 키는 백엔드 SiteContentKey 와 같다.
 * 수정하지 않은 문구는 서버가 기본값(시안 문구)을 채워 준다.
 */
export type SiteContentKey =
  | "HOME_BEST_PICKS_DESCRIPTION"
  | "HOME_WHATS_NEW_DESCRIPTION"
  | "HOME_SPECIAL_DESCRIPTION"
  | "HOME_REVIEW_DESCRIPTION";

export type SiteContents = Record<SiteContentKey, string>;

/** 서버 렌더에서 호출한다(60초 주기로 갱신). */
export async function getSiteContents(): Promise<SiteContents> {
  return apiFetch<SiteContents>("/api/site-contents");
}

export type AdminSiteContent = {
  key: SiteContentKey;
  label: string;
  value: string;
  defaultValue: string;
  /** 관리자가 수정했는지. false 면 기본값을 쓰는 중. */
  customized: boolean;
  updatedAt: string | null;
};

export const listAdminSiteContents = () =>
  apiFetch<AdminSiteContent[]>("/api/admin/site-contents", { auth: true });

export const updateAdminSiteContent = (key: SiteContentKey, value: string) =>
  apiFetch<AdminSiteContent>(`/api/admin/site-contents/${key}`, { method: "PUT", auth: true, json: { value } });

export const resetAdminSiteContent = (key: SiteContentKey) =>
  apiFetch<AdminSiteContent>(`/api/admin/site-contents/${key}`, { method: "DELETE", auth: true });
