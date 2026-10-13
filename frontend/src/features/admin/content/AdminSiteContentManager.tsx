"use client";

import { useEffect, useState } from "react";

import { MultilineText } from "@/components/ui/MultilineText";
import { errorMessage } from "@/lib/api/client";
import {
  listAdminSiteContents,
  resetAdminSiteContent,
  updateAdminSiteContent,
  type AdminSiteContent,
} from "@/lib/api/site-content";

import { formatDateTime } from "../format";
import { ImageInput } from "../ImageInput";
import { Button, Card, Chip, Notice, PageHeader, textareaClass } from "../ui";

/** 화면별로 묶어 보인다. 키 접두어로 나눈다. */
const SECTIONS: { title: string; prefix: string }[] = [
  { title: "메인", prefix: "HOME_" },
  { title: "About 페이지", prefix: "ABOUT_" },
];

/**
 * 사이트 문구 관리. 메인 화면 섹션 설명과 About 페이지 글·이미지를 여기서 고친다.
 * 줄바꿈은 화면에서도 줄바꿈으로 보이고, 비우면 그 문구(이미지)가 숨겨진다. 저장 후 1분 안에 반영된다.
 */
export function AdminSiteContentManager() {
  const [items, setItems] = useState<AdminSiteContent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAdminSiteContents()
      .then(setItems)
      .catch((e: unknown) => setError(errorMessage(e)));
  }, []);

  const replace = (next: AdminSiteContent) =>
    setItems((prev) => prev?.map((item) => (item.key === next.key ? next : item)) ?? prev);

  return (
    <>
      <PageHeader
        title="문구·About"
        description="메인 화면 설명 문구와 About 페이지 글·이미지. 줄바꿈은 그대로 반영되고(About 글은 빈 줄로 문단 구분), 비워 두면 숨겨집니다. 저장 후 1분 안에 반영됩니다."
      />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {!items ? (
        <div className="h-60 animate-pulse rounded-lg bg-black/[0.04]" />
      ) : (
        <div className="space-y-8">
          {SECTIONS.map((section) => {
            const sectionItems = items.filter((item) => item.key.startsWith(section.prefix));
            if (sectionItems.length === 0) return null;
            return (
              <section key={section.prefix}>
                <h2 className="mb-3 text-[15px] font-bold">{section.title}</h2>
                <div className="grid gap-4 xl:grid-cols-2">
                  {sectionItems.map((item) => (
                    <ContentEditor key={item.key} item={item} onSaved={replace} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function ContentEditor({ item, onSaved }: { item: AdminSiteContent; onSaved: (next: AdminSiteContent) => void }) {
  const [value, setValue] = useState(item.value);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  const dirty = value !== item.value;

  const run = async (action: () => Promise<AdminSiteContent>, done: string) => {
    setPending(true);
    try {
      const next = await action();
      onSaved(next);
      setValue(next.value);
      setMessage({ kind: "success", text: done });
    } catch (e) {
      setMessage({ kind: "error", text: errorMessage(e) });
    } finally {
      setPending(false);
    }
  };

  return (
    <Card
      title={item.label}
      actions={<Chip tone={item.customized ? "brand" : "muted"}>{item.customized ? "수정됨" : "기본값"}</Chip>}
    >
      <label htmlFor={`content-${item.key}`} className="sr-only">
        {item.label}
      </label>
      {item.kind === "IMAGE" ? (
        <>
          <ImageInput
            id={`content-${item.key}`}
            value={value}
            onChange={(next) => {
              setValue(next);
              setMessage(null);
            }}
            category="contents"
          />
          <p className="mt-2 text-[12px] text-ink-subtle">비워 두면 화면에 이미지를 표시하지 않습니다.</p>
        </>
      ) : (
        <>
          <textarea
            id={`content-${item.key}`}
            rows={item.maxLength > 500 ? 12 : 4}
            maxLength={item.maxLength}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setMessage(null);
            }}
            className={textareaClass}
          />
          <p className="mt-1 text-right text-[12px] tabular-nums text-ink-subtle">
            {value.length}/{item.maxLength}
          </p>

          <p className="mb-1 mt-3 text-[12px] font-medium text-ink-subtle">미리보기</p>
          <div className="max-h-[320px] overflow-y-auto rounded-md bg-surface-primary px-4 py-3 text-[15px] leading-[24px] tracking-[-0.3px] text-ink-muted">
            {value.trim() ? <MultilineText text={value.trim()} /> : <span className="text-ink-subtle">(비어 있으면 화면에 표시하지 않습니다)</span>}
          </div>
        </>
      )}

      {message ? (
        <div className="mt-3">
          <Notice kind={message.kind}>{message.text}</Notice>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] text-ink-subtle">
          {item.updatedAt ? `마지막 수정 ${formatDateTime(item.updatedAt)}` : "수정한 적 없음"}
        </span>
        <div className="flex gap-2">
          <Button
            disabled={pending || !item.customized}
            onClick={() =>
              window.confirm("기본 문구로 되돌릴까요?") &&
              run(() => resetAdminSiteContent(item.key), "기본 문구로 되돌렸습니다. 1분 안에 반영됩니다.")
            }
          >
            기본값으로
          </Button>
          <Button
            variant="primary"
            disabled={pending || !dirty}
            onClick={() => run(() => updateAdminSiteContent(item.key, value), "저장했습니다. 1분 안에 반영됩니다.")}
          >
            저장
          </Button>
        </div>
      </div>
    </Card>
  );
}
