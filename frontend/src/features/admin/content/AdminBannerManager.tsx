"use client";

import { useCallback, useEffect, useState } from "react";

import { createAdminBanner, deleteAdminBanner, listAdminBanners, updateAdminBanner } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import type { AdminBanner, AdminBannerInput } from "@/types/admin";

import { ImageInput } from "../ImageInput";
import { Button, Card, Chip, Empty, Field, Notice, PageHeader, inputClass } from "../ui";

const EMPTY: AdminBannerInput = { captionLines: ["", ""], href: "/", imageUrl: "", alt: "", sortOrder: 0, active: true };

/**
 * 메인 히어로 배너 관리. 노출 순서는 "순서" 숫자가 작은 것부터, 비활성 배너는 메인에서 빠진다.
 * 권장 이미지 비율은 1440 × 814 (가로형).
 */
export function AdminBannerManager() {
  const [banners, setBanners] = useState<AdminBanner[] | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; form: AdminBannerInput } | null>(null);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  const load = useCallback(() => {
    listAdminBanners()
      .then(setBanners)
      .catch((e: unknown) => setMessage({ kind: "error", text: errorMessage(e) }));
  }, []);

  useEffect(load, [load]);

  const startNew = () =>
    setEditing({
      id: null,
      form: { ...EMPTY, sortOrder: (banners?.reduce((max, b) => Math.max(max, b.sortOrder), 0) ?? 0) + 1 },
    });

  const save = async () => {
    if (!editing) return;
    const form = { ...editing.form, captionLines: editing.form.captionLines.map((l) => l.trim()).filter(Boolean) };
    if (form.captionLines.length === 0 || !form.alt.trim() || !form.href.trim()) {
      setMessage({ kind: "error", text: "캡션 한 줄 이상, 링크, 대체 텍스트를 입력해 주세요." });
      return;
    }
    try {
      if (editing.id) await updateAdminBanner(editing.id, form);
      else await createAdminBanner(form);
      setEditing(null);
      setMessage({ kind: "success", text: "저장했습니다. 메인 화면에는 1분 안에 반영됩니다." });
      load();
    } catch (e) {
      setMessage({ kind: "error", text: errorMessage(e) });
    }
  };

  const remove = async (banner: AdminBanner) => {
    if (!window.confirm("이 배너를 삭제할까요?")) return;
    try {
      await deleteAdminBanner(banner.id);
      load();
    } catch (e) {
      setMessage({ kind: "error", text: errorMessage(e) });
    }
  };

  const setForm = (patch: Partial<AdminBannerInput>) =>
    setEditing((prev) => (prev ? { ...prev, form: { ...prev.form, ...patch } } : prev));

  return (
    <>
      <PageHeader
        title="배너"
        description="메인 화면 슬라이드 배너. 순서 숫자가 작은 것부터 보이고, 비활성 배너는 숨겨집니다."
        actions={
          <Button variant="primary" onClick={startNew}>
            배너 추가
          </Button>
        }
      />
      {message ? (
        <div className="mb-4">
          <Notice kind={message.kind}>{message.text}</Notice>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          {!banners ? (
            <div className="h-60 animate-pulse bg-black/[0.04]" />
          ) : banners.length === 0 ? (
            <Empty>배너가 없습니다.</Empty>
          ) : (
            <ul className="divide-y divide-black/5">
              {banners.map((b) => (
                <li key={b.id} className="flex items-center gap-4 py-3">
                  <div className="h-[56px] w-[100px] flex-none overflow-hidden rounded bg-black/[0.04]">
                    {b.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- 관리자 썸네일
                      <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 text-[13px]">
                    <p className="truncate font-medium text-ink-primary">{b.captionLines.join(" / ")}</p>
                    <p className="truncate text-ink-subtle">
                      순서 {b.sortOrder} · {b.href}
                    </p>
                  </div>
                  <Chip tone={b.active ? "brand" : "muted"}>{b.active ? "노출" : "비활성"}</Chip>
                  <Button size="sm" onClick={() => setEditing({ id: b.id, form: { ...b, imageUrl: b.imageUrl ?? "" } })}>
                    수정
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(b)}>
                    삭제
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {editing ? (
          <Card title={editing.id ? "배너 수정" : "새 배너"}>
            <div className="space-y-4">
              <Field label="이미지 (권장 1440 × 814)">
                <ImageInput category="banners" value={editing.form.imageUrl ?? ""} onChange={(url) => setForm({ imageUrl: url })} />
              </Field>
              {[0, 1].map((i) => (
                <Field key={i} label={`캡션 ${i + 1}줄`} htmlFor={`b-cap-${i}`}>
                  <input
                    id={`b-cap-${i}`}
                    value={editing.form.captionLines[i] ?? ""}
                    onChange={(e) => {
                      const lines = [...editing.form.captionLines];
                      lines[i] = e.target.value;
                      setForm({ captionLines: lines });
                    }}
                    className={inputClass}
                  />
                </Field>
              ))}
              <Field label="클릭 시 이동할 주소" htmlFor="b-href" hint="예: /products/phone-case">
                <input id="b-href" value={editing.form.href} onChange={(e) => setForm({ href: e.target.value })} className={inputClass} />
              </Field>
              <Field label="대체 텍스트 (스크린리더용)" htmlFor="b-alt">
                <input id="b-alt" value={editing.form.alt} onChange={(e) => setForm({ alt: e.target.value })} className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="순서" htmlFor="b-order">
                  <input
                    id="b-order"
                    type="number"
                    min={0}
                    value={editing.form.sortOrder}
                    onChange={(e) => setForm({ sortOrder: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>
                <Field label="노출">
                  <label className="flex h-10 items-center gap-2 text-[14px]">
                    <input type="checkbox" checked={editing.form.active} onChange={(e) => setForm({ active: e.target.checked })} />
                    메인에 노출
                  </label>
                </Field>
              </div>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setEditing(null)}>취소</Button>
                <Button variant="primary" onClick={save}>
                  저장
                </Button>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </>
  );
}
