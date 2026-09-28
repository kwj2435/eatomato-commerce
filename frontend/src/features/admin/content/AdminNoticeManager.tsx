"use client";

import { useCallback, useEffect, useState } from "react";

import { createAdminNotice, deleteAdminNotice, listAdminNotices, updateAdminNotice } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import type { AdminNotice, AdminNoticeInput } from "@/types/admin";

import { formatDateTime } from "../format";
import { Button, Card, Chip, Empty, Field, Notice, PageHeader, inputClass, tableClass, tdClass, textareaClass, thClass } from "../ui";

type Form = { title: string; number: string; pinned: boolean; author: string; body: string };

const EMPTY: Form = { title: "", number: "", pinned: false, author: "관리자", body: "" };

function toInput(form: Form, publishedAt: string | null): AdminNoticeInput {
  return {
    title: form.title.trim(),
    number: form.pinned || !form.number ? null : Number(form.number),
    pinned: form.pinned,
    author: form.author.trim(),
    publishedAt,
    // 문단은 줄 단위. 서버도 줄바꿈을 문단 구분으로 펼친다.
    body: form.body.split("\n").map((l) => l.trim()).filter(Boolean),
  };
}

/** 공지사항 관리. 고정 공지는 번호 대신 "공지" 라벨로 목록 맨 위에 붙는다. */
export function AdminNoticeManager() {
  const [notices, setNotices] = useState<AdminNotice[] | null>(null);
  const [editing, setEditing] = useState<{ notice: AdminNotice | null; form: Form } | null>(null);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  const load = useCallback(() => {
    listAdminNotices()
      .then(setNotices)
      .catch((e: unknown) => setMessage({ kind: "error", text: errorMessage(e) }));
  }, []);

  useEffect(load, [load]);

  const nextNumber = () => (notices?.reduce((max, n) => Math.max(max, n.number ?? 0), 0) ?? 0) + 1;

  const save = async () => {
    if (!editing) return;
    const input = toInput(editing.form, editing.notice?.publishedAt ?? null);
    if (!input.title || input.body.length === 0) {
      setMessage({ kind: "error", text: "제목과 본문을 입력해 주세요." });
      return;
    }
    try {
      if (editing.notice) await updateAdminNotice(editing.notice.id, input);
      else await createAdminNotice(input);
      setEditing(null);
      setMessage({ kind: "success", text: "저장했습니다. 공지사항 화면에는 1분 안에 반영됩니다." });
      load();
    } catch (e) {
      setMessage({ kind: "error", text: errorMessage(e) });
    }
  };

  const remove = async (notice: AdminNotice) => {
    if (!window.confirm(`'${notice.title}' 공지를 삭제할까요?`)) return;
    try {
      await deleteAdminNotice(notice.id);
      load();
    } catch (e) {
      setMessage({ kind: "error", text: errorMessage(e) });
    }
  };

  const setForm = (patch: Partial<Form>) =>
    setEditing((prev) => (prev ? { ...prev, form: { ...prev.form, ...patch } } : prev));

  return (
    <>
      <PageHeader
        title="공지"
        actions={
          <Button variant="primary" onClick={() => setEditing({ notice: null, form: { ...EMPTY, number: String(nextNumber()) } })}>
            공지 작성
          </Button>
        }
      />
      {message ? (
        <div className="mb-4">
          <Notice kind={message.kind}>{message.text}</Notice>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          {!notices ? (
            <div className="h-60 animate-pulse bg-black/[0.04]" />
          ) : notices.length === 0 ? (
            <Empty>공지가 없습니다.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>번호</th>
                    <th className={thClass}>제목</th>
                    <th className={thClass}>등록일</th>
                    <th className={thClass}>
                      <span className="sr-only">관리</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map((n) => (
                    <tr key={n.id}>
                      <td className={`${tdClass} whitespace-nowrap`}>{n.pinned ? <Chip tone="brand">공지</Chip> : n.number}</td>
                      <td className={`${tdClass} max-w-[320px] truncate`}>{n.title}</td>
                      <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{formatDateTime(n.publishedAt)}</td>
                      <td className={`${tdClass} whitespace-nowrap text-right`}>
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({
                              notice: n,
                              form: {
                                title: n.title,
                                number: n.number ? String(n.number) : "",
                                pinned: n.pinned,
                                author: n.author,
                                body: n.body.join("\n"),
                              },
                            })
                          }
                          className="mr-3 text-[13px] text-ink-muted hover:underline"
                        >
                          수정
                        </button>
                        <button type="button" onClick={() => remove(n)} className="text-[13px] text-brand-primary hover:underline">
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {editing ? (
          <Card title={editing.notice ? "공지 수정" : "새 공지"}>
            <div className="space-y-4">
              <Field label="제목" htmlFor="n-title">
                <input id="n-title" value={editing.form.title} onChange={(e) => setForm({ title: e.target.value })} className={inputClass} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="고정">
                  <label className="flex h-10 items-center gap-2 text-[14px]">
                    <input type="checkbox" checked={editing.form.pinned} onChange={(e) => setForm({ pinned: e.target.checked })} />
                    상단 고정
                  </label>
                </Field>
                <Field label="번호" htmlFor="n-number">
                  <input
                    id="n-number"
                    type="number"
                    min={1}
                    disabled={editing.form.pinned}
                    value={editing.form.pinned ? "" : editing.form.number}
                    onChange={(e) => setForm({ number: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="글쓴이" htmlFor="n-author">
                  <input id="n-author" value={editing.form.author} onChange={(e) => setForm({ author: e.target.value })} className={inputClass} />
                </Field>
              </div>
              <Field label="본문" htmlFor="n-body" hint="줄마다 한 문단으로 표시됩니다.">
                <textarea id="n-body" rows={10} value={editing.form.body} onChange={(e) => setForm({ body: e.target.value })} className={textareaClass} />
              </Field>
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
