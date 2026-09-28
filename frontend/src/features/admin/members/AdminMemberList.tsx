"use client";

import { useCallback, useEffect, useState } from "react";

import { getAdminMember, listAdminMembers, updateAdminMember } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatKRW } from "@/lib/utils/format";
import type { AdminMemberDetail, AdminMemberSummary, Page } from "@/types/admin";
import type { MemberRole } from "@/types/member";
import { ORDER_STATUS_LABELS } from "@/types/order";

import { formatDateTime } from "../format";
import { Button, Card, Chip, Empty, Field, Notice, PageHeader, Pagination, inputClass, tableClass, tdClass, thClass } from "../ui";

/** 회원 관리: 목록(검색·권한 필터) + 선택한 회원 상세(등급·권한·이용 정지 변경, 최근 주문). */
export function AdminMemberList() {
  const [q, setQ] = useState("");
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState<MemberRole | "">("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<AdminMemberSummary> | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    listAdminMembers({ q: keyword, role, page })
      .then(setData)
      .catch((e: unknown) => setError(errorMessage(e)));
  }, [keyword, role, page]);

  useEffect(load, [load]);

  return (
    <>
      <PageHeader title="회원" description="이용 정지한 회원은 로그인할 수 없습니다. 관리자 권한은 여기서 주고 뺄 수 있습니다." />
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <form
            className="mb-4 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(0);
              setKeyword(q.trim());
            }}
          >
            <select
              aria-label="권한"
              value={role}
              onChange={(e) => {
                setPage(0);
                setRole(e.target.value as MemberRole | "");
              }}
              className={`${inputClass} w-32`}
            >
              <option value="">전체</option>
              <option value="USER">일반</option>
              <option value="ADMIN">관리자</option>
            </select>
            <input
              aria-label="회원 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="아이디·이름·이메일"
              className={`${inputClass} w-60`}
            />
            <Button type="submit">검색</Button>
          </form>

          {error ? <Notice kind="error">{error}</Notice> : null}

          {!data ? (
            <div className="h-60 animate-pulse rounded-md bg-black/[0.04]" />
          ) : data.content.length === 0 ? (
            <Empty>회원이 없습니다.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>회원</th>
                    <th className={thClass}>등급</th>
                    <th className={`${thClass} text-right`}>주문</th>
                    <th className={`${thClass} text-right`}>구매액</th>
                    <th className={thClass}>상태</th>
                    <th className={thClass}>가입일</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => setSelected(m.id)}
                      className={selected === m.id ? "bg-brand-tint" : "cursor-pointer hover:bg-black/[0.02]"}
                    >
                      <td className={tdClass}>
                        <button type="button" onClick={() => setSelected(m.id)} className="text-left">
                          <span className="font-medium text-ink-primary">{m.name}</span>
                          <span className="block text-[12px] text-ink-subtle">
                            {m.loginId} · {m.email}
                          </span>
                        </button>
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>{m.grade}</td>
                      <td className={`${tdClass} text-right tabular-nums`}>{m.orderCount}</td>
                      <td className={`${tdClass} whitespace-nowrap text-right tabular-nums`}>{formatKRW(m.totalSpent)}</td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        <span className="flex gap-1">
                          {m.role === "ADMIN" ? <Chip tone="brand">관리자</Chip> : null}
                          {!m.enabled ? <Chip tone="muted">정지</Chip> : null}
                          {m.role !== "ADMIN" && m.enabled ? <Chip>정상</Chip> : null}
                        </span>
                      </td>
                      <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{formatDateTime(m.createdAt).slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data ? <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} /> : null}
        </Card>

        {selected ? (
          <MemberDetailPanel key={selected} memberId={selected} onChanged={load} />
        ) : (
          <Card>
            <Empty>왼쪽 목록에서 회원을 고르면 상세 정보가 여기에 나옵니다.</Empty>
          </Card>
        )}
      </div>
    </>
  );
}

function MemberDetailPanel({ memberId, onChanged }: { memberId: string; onChanged: () => void }) {
  const myLoginId = useAuthStore((s) => s.member?.id);
  const [detail, setDetail] = useState<AdminMemberDetail | null>(null);
  const [grade, setGrade] = useState("");
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    getAdminMember(memberId)
      .then((d) => {
        setDetail(d);
        setGrade(d.summary.grade);
      })
      .catch((e: unknown) => setMessage({ kind: "error", text: errorMessage(e) }));
  }, [memberId]);

  if (!detail) {
    return <Card>{message ? <Notice kind="error">{message.text}</Notice> : <div className="h-60 animate-pulse bg-black/[0.04]" />}</Card>;
  }

  const { summary, profile } = detail;
  const isMe = summary.loginId === myLoginId;

  const apply = async (patch: Parameters<typeof updateAdminMember>[1], done: string) => {
    try {
      const next = await updateAdminMember(memberId, patch);
      setDetail(next);
      setGrade(next.summary.grade);
      setMessage({ kind: "success", text: done });
      onChanged();
    } catch (e) {
      setMessage({ kind: "error", text: errorMessage(e) });
    }
  };

  const address = [profile.address.zipCode && `(${profile.address.zipCode})`, profile.address.road, profile.address.detail]
    .filter(Boolean)
    .join(" ");

  return (
    <Card title={`${summary.name} (${summary.loginId})`}>
      {message ? (
        <div className="mb-3">
          <Notice kind={message.kind}>{message.text}</Notice>
        </div>
      ) : null}

      <dl className="grid grid-cols-[88px_1fr] gap-y-2 text-[13px]">
        <dt className="text-ink-subtle">이메일</dt>
        <dd>{summary.email}</dd>
        <dt className="text-ink-subtle">휴대폰</dt>
        <dd>{summary.phone ?? "-"}</dd>
        <dt className="text-ink-subtle">주소</dt>
        <dd>{address || "-"}</dd>
        <dt className="text-ink-subtle">마케팅 수신</dt>
        <dd>{profile.marketingChannels.length ? profile.marketingChannels.join(", ") : "동의 안 함"}</dd>
        <dt className="text-ink-subtle">가입일</dt>
        <dd>{formatDateTime(summary.createdAt)}</dd>
        <dt className="text-ink-subtle">구매</dt>
        <dd>
          {summary.orderCount}건 · {formatKRW(summary.totalSpent)}
        </dd>
      </dl>

      <div className="mt-5 space-y-4 border-t border-black/10 pt-4">
        <Field label="회원 등급" htmlFor="m-grade">
          <div className="flex gap-2">
            <input id="m-grade" value={grade} onChange={(e) => setGrade(e.target.value)} className={inputClass} />
            <Button disabled={!grade.trim() || grade === summary.grade} onClick={() => apply({ grade: grade.trim() }, "등급을 바꿨습니다.")}>
              저장
            </Button>
          </div>
        </Field>

        <div className="flex flex-wrap gap-2">
          {summary.role === "ADMIN" ? (
            <Button disabled={isMe} onClick={() => apply({ role: "USER" }, "관리자 권한을 해제했습니다.")}>
              관리자 권한 해제
            </Button>
          ) : (
            <Button
              onClick={() =>
                window.confirm(`${summary.name} 님에게 관리자 권한을 줄까요?`) &&
                apply({ role: "ADMIN" }, "관리자 권한을 부여했습니다.")
              }
            >
              관리자로 지정
            </Button>
          )}
          {summary.enabled ? (
            <Button
              variant="danger"
              disabled={isMe}
              onClick={() =>
                window.confirm(`${summary.name} 님을 이용 정지할까요? 로그인할 수 없게 됩니다.`) &&
                apply({ enabled: false }, "이용 정지했습니다.")
              }
            >
              이용 정지
            </Button>
          ) : (
            <Button onClick={() => apply({ enabled: true }, "이용 정지를 풀었습니다.")}>정지 해제</Button>
          )}
        </div>
        {isMe ? <p className="text-[12px] text-ink-subtle">본인 계정의 권한·이용 상태는 바꿀 수 없습니다.</p> : null}
      </div>

      <div className="mt-5 border-t border-black/10 pt-4">
        <h3 className="mb-2 text-[13px] font-bold">최근 주문</h3>
        {detail.recentOrders.length === 0 ? (
          <p className="text-[13px] text-ink-subtle">주문이 없습니다.</p>
        ) : (
          <ul className="space-y-1.5 text-[13px]">
            {detail.recentOrders.map((o) => (
              <li key={o.orderNumber} className="flex justify-between gap-3">
                <span className="tabular-nums text-ink-muted">{formatDateTime(o.orderedAt)}</span>
                <span className="min-w-0 flex-1 truncate">{o.items[0]?.name}</span>
                <span className="tabular-nums">{formatKRW(o.total)}</span>
                <span className="w-14 text-right text-ink-subtle">{ORDER_STATUS_LABELS[o.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
