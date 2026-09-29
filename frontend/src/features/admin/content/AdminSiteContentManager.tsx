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
import { Button, Card, Chip, Notice, PageHeader, textareaClass } from "../ui";

const MAX_LENGTH = 500;

/**
 * 사이트 문구 관리. 메인 화면 섹션 설명처럼 코드에 박혀 있던 문구를 여기서 고친다.
 * 줄바꿈은 화면에서도 줄바꿈으로 보이고, 비우면 그 문구 줄이 숨겨진다. 저장 후 1분 안에 반영된다.
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
        title="문구"
        description="메인 화면 등 사이트 곳곳의 설명 문구. 줄바꿈은 그대로 반영되고, 비워 두면 그 문구가 숨겨집니다. 저장 후 1분 안에 반영됩니다."
      />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {!items ? (
        <div className="h-60 animate-pulse rounded-lg bg-black/[0.04]" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <ContentEditor key={item.key} item={item} onSaved={replace} />
          ))}
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
      <textarea
        id={`content-${item.key}`}
        rows={4}
        maxLength={MAX_LENGTH}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setMessage(null);
        }}
        className={textareaClass}
      />
      <p className="mt-1 text-right text-[12px] tabular-nums text-ink-subtle">
        {value.length}/{MAX_LENGTH}
      </p>

      <p className="mb-1 mt-3 text-[12px] font-medium text-ink-subtle">미리보기</p>
      <div className="rounded-md bg-surface-primary px-4 py-3 text-[15px] leading-[24px] tracking-[-0.3px] text-ink-muted">
        {value.trim() ? <MultilineText text={value.trim()} /> : <span className="text-ink-subtle">(비어 있으면 화면에 표시하지 않습니다)</span>}
      </div>

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
