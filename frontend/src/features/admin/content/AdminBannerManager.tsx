"use client";

import { useCallback, useEffect, useState } from "react";

import { createAdminBanner, deleteAdminBanner, listAdminBanners, updateAdminBanner } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import type { AdminBanner, AdminBannerInput } from "@/types/admin";
import type { BannerPlacement } from "@/types/banner";

import { ImageInput } from "../ImageInput";
import { Button, Card, Chip, Empty, Field, Notice, PageHeader, inputClass } from "../ui";

/** 위치별 안내. 링크 규칙은 백엔드 AdminBannerController 와 같다. */
const PLACEMENTS: Record<
  BannerPlacement,
  { label: string; imageHint: string; hrefHint: string | null; defaultHref: string; description: string }
> = {
  HERO: {
    label: "메인 상단",
    imageHint: "권장 1440 × 814",
    hrefHint: "예: /products/phone-case",
    defaultHref: "/",
    description: "메인 맨 위 슬라이드. 누르면 입력한 주소로 이동합니다.",
  },
  BEST_PICK: {
    label: "Best Picks",
    imageHint: "권장 1200 × 1200 (정사각형)",
    hrefHint: null,
    defaultHref: "",
    description: "Best Picks 왼쪽 슬라이드. 이미지만 보이고 링크는 없습니다. 오른쪽 4칸은 BEST 배지를 단 상품이 자동으로 들어갑니다.",
  },
  SPECIAL: {
    label: "Special",
    imageHint: "1·2번째 권장 600 × 900 (세로형), 3번째 1200 × 900 (가로형)",
    hrefHint: "비우면 공지 목록(/notice). 특정 공지는 예: /notice/12",
    defaultHref: "",
    description: "Special 혜택 배너. 세 장씩 한 줄로 보이고 세 번째는 두 배 너비입니다. 누르면 공지로 이동합니다.",
  },
};

const PLACEMENT_ORDER: BannerPlacement[] = ["HERO", "BEST_PICK", "SPECIAL"];

/**
 * 메인 배너 관리(상단 슬라이드·Best Picks·Special). 위치마다 "순서" 숫자가 작은 것부터 보이고, 비활성 배너는 메인에서 빠진다.
 * 문구는 이미지에 직접 넣으므로 이미지가 필수이고, 이미지 속 문구는 대체 텍스트(alt)에 적는다.
 */
export function AdminBannerManager() {
  const [allBanners, setBanners] = useState<AdminBanner[] | null>(null);
  const [placement, setPlacement] = useState<BannerPlacement>("HERO");
  const banners = allBanners?.filter((b) => b.placement === placement) ?? null;
  const guide = PLACEMENTS[placement];
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
      form: {
        placement,
        href: guide.defaultHref,
        imageUrl: "",
        alt: "",
        active: true,
        sortOrder: (banners?.reduce((max, b) => Math.max(max, b.sortOrder), 0) ?? 0) + 1,
      },
    });

  const save = async () => {
    if (!editing) return;
    const form = {
      ...editing.form,
      imageUrl: editing.form.imageUrl.trim(),
      href: editing.form.href.trim(),
      alt: editing.form.alt.trim(),
    };
    if (!form.imageUrl || !form.alt || (form.placement === "HERO" && !form.href)) {
      setMessage({
        kind: "error",
        text: form.placement === "HERO" ? "이미지, 링크, 대체 텍스트를 모두 입력해 주세요." : "이미지와 대체 텍스트를 입력해 주세요.",
      });
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
        description="메인 화면 배너. 위치마다 순서 숫자가 작은 것부터 보이고, 비활성 배너는 숨겨집니다."
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

      <div role="tablist" aria-label="배너 위치" className="mb-3 flex flex-wrap gap-2">
        {PLACEMENT_ORDER.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={p === placement}
            onClick={() => {
              setPlacement(p);
              setEditing(null);
            }}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
              p === placement ? "border-ink-primary bg-ink-primary text-white" : "border-black/10 hover:border-black/30",
            )}
          >
            {PLACEMENTS[p].label}
            {allBanners ? ` ${allBanners.filter((b) => b.placement === p).length}` : ""}
          </button>
        ))}
      </div>
      <p className="mb-4 text-[13px] text-ink-subtle">{guide.description}</p>

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
                    <p className="truncate font-medium text-ink-primary">{b.alt}</p>
                    <p className="truncate text-ink-subtle">
                      순서 {b.sortOrder}
                      {b.href ? ` · ${b.href}` : ""}
                    </p>
                  </div>
                  <Chip tone={b.active ? "brand" : "muted"}>{b.active ? "노출" : "비활성"}</Chip>
                  <Button
                    size="sm"
                    onClick={() =>
                      setEditing({
                        id: b.id,
                        form: {
                          placement: b.placement,
                          href: b.href,
                          imageUrl: b.imageUrl,
                          alt: b.alt,
                          sortOrder: b.sortOrder,
                          active: b.active,
                        },
                      })
                    }
                  >
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
          <Card title={`${guide.label} · ${editing.id ? "배너 수정" : "새 배너"}`}>
            <div className="space-y-4">
              <Field label={`이미지 (${guide.imageHint})`} hint="문구가 필요하면 이미지에 직접 넣어 주세요.">
                <ImageInput category="banners" value={editing.form.imageUrl} onChange={(url) => setForm({ imageUrl: url })} />
              </Field>
              {guide.hrefHint ? (
                <Field label="클릭 시 이동할 주소" htmlFor="b-href" hint={guide.hrefHint}>
                  <input id="b-href" value={editing.form.href} onChange={(e) => setForm({ href: e.target.value })} className={inputClass} />
                </Field>
              ) : null}
              <Field label="대체 텍스트 (스크린리더용)" htmlFor="b-alt" hint="이미지에 넣은 문구를 그대로 적어 주세요. 예: 시즌 컬렉션 — 감각적인 톤 온 톤">
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
