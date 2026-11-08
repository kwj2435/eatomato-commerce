"use client";

import { useEffect, useState } from "react";

import { resolveCategory } from "@/features/product-list/categories";
import { getAnalytics } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import type { Analytics, PageType } from "@/types/admin";

import { BarChart } from "../BarChart";
import { Card, Chip, Empty, Notice, PageHeader, tableClass, tdClass, thClass } from "../ui";

const RANGES = [
  { days: 1, label: "오늘" },
  { days: 7, label: "7일" },
  { days: 30, label: "30일" },
  { days: 90, label: "90일" },
] as const;

const BAR_COLOR = "#a34d38"; // brand-deep, BarChart 와 같은 단일 계열 색

const PAGE_TYPE_LABELS: Record<PageType, string> = {
  HOME: "메인",
  CATEGORY: "상품 목록",
  PRODUCT: "상품 상세",
  SEARCH: "검색",
  CART: "장바구니",
  CHECKOUT: "주문·결제",
  MYPAGE: "마이페이지",
  NOTICE: "공지",
  LOGIN: "로그인·가입",
  OTHER: "기타",
};

const DEVICE_LABELS: Record<string, string> = { MOBILE: "모바일", TABLET: "태블릿", DESKTOP: "PC" };

/**
 * 방문자 분석. 스토어 페이지를 열 때마다 남긴 기록(PageViewTracker)을 모아 보여 준다.
 * 기록은 3개월만 보관하므로 기간은 최대 90일이다.
 */
export function AdminAnalytics() {
  const [days, setDays] = useState<number>(7);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAnalytics(days)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const rangeLabel = days === 1 ? "오늘" : `최근 ${days}일`;

  return (
    <>
      <PageHeader
        title="방문자 분석"
        description="스토어 페이지 방문 기록입니다. 관리자 계정과 검색 로봇은 세지 않으며, 기록은 3개월 동안 보관합니다."
        actions={
          <div role="group" aria-label="기간" className="inline-flex rounded-md border border-black/15 bg-white p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                aria-pressed={days === r.days}
                onClick={() => setDays(r.days)}
                className={cn(
                  "h-8 rounded px-3 text-[13px] transition-colors",
                  days === r.days ? "bg-brand-deep font-medium text-white" : "text-ink-muted hover:bg-black/[0.04]",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {error ? <Notice kind="error">{error}</Notice> : null}
      {!data && !error ? <div className="h-[480px] animate-pulse rounded-lg bg-black/[0.04]" /> : null}
      {data ? <AnalyticsBody data={data} rangeLabel={rangeLabel} /> : null}
    </>
  );
}

function AnalyticsBody({ data, rangeLabel }: { data: Analytics; rangeLabel: string }) {
  const diff = data.today.visitors - data.yesterdaySameTime.visitors;
  const perVisit = data.range.sessions > 0 ? data.range.pageViews / data.range.sessions : 0;
  const empty = data.range.pageViews === 0;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {/* 대표 숫자는 오늘 방문자 하나 */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] text-ink-subtle">오늘 방문자</p>
            <p className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
              <span aria-hidden className="h-2 w-2 rounded-full bg-[#2F8A3A]" />
              지금 {data.liveVisitors}명 보는 중
            </p>
          </div>
          <p className="mt-1 text-[48px] font-semibold leading-none tracking-[-1px] text-ink-primary tabular-nums">
            {fmt(data.today.visitors)}
            <span className="ml-1 text-[20px] font-medium tracking-normal text-ink-muted">명</span>
          </p>
          <p className="mt-2 text-[13px] text-ink-muted">
            어제 이 시각 {fmt(data.yesterdaySameTime.visitors)}명
            {diff !== 0 ? (
              <span className="text-ink-body">
                {" "}
                ({diff > 0 ? "▲" : "▼"} {fmt(Math.abs(diff))}명)
              </span>
            ) : null}
          </p>
        </Card>
        <StatTile label="오늘 페이지 조회" value={`${fmt(data.today.pageViews)}회`} sub={`방문 ${fmt(data.today.sessions)}회`} />
        <StatTile
          label={`${rangeLabel} 방문자`}
          value={`${fmt(data.range.visitors)}명`}
          sub={`방문 ${fmt(data.range.sessions)}회 · 조회 ${fmt(data.range.pageViews)}회`}
        />
        <StatTile label="방문당 페이지 조회" value={`${perVisit.toFixed(1)}쪽`} sub={rangeLabel} />
      </div>

      {empty ? (
        <Card className="mt-4">
          <Empty>이 기간에 기록된 방문이 없습니다. 방문 기록은 이 기능을 배포한 뒤부터 쌓입니다.</Empty>
        </Card>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-4">
          {data.days > 1 ? (
            <Card title={`일별 방문자 (${rangeLabel})`}>
              <BarChart
                ariaLabel={`${rangeLabel} 일별 방문자`}
                bars={data.daily.map((d, i) => ({
                  key: d.date,
                  value: d.visitors,
                  axisLabel: (data.daily.length - 1 - i) % labelStep(data.daily.length) === 0 ? shortDate(d.date) : undefined,
                  title: `방문자 ${fmt(d.visitors)}명`,
                  sub: `${d.date} · 조회 ${fmt(d.pageViews)}회`,
                }))}
                table={{
                  headers: ["날짜", "방문자", "방문", "조회"],
                  rows: data.daily.map((d) => [d.date, `${fmt(d.visitors)}명`, `${fmt(d.sessions)}회`, `${fmt(d.pageViews)}회`]),
                }}
              />
            </Card>
          ) : null}
          <Card title="오늘 시간대별 방문자">
            <BarChart
              ariaLabel="오늘 시간대별 방문자"
              bars={data.hourlyToday.map((h) => ({
                key: String(h.hour),
                value: h.visitors,
                axisLabel: h.hour % 3 === 0 ? `${h.hour}시` : undefined,
                title: `방문자 ${fmt(h.visitors)}명`,
                sub: `${h.hour}시 · 조회 ${fmt(h.pageViews)}회`,
              }))}
              table={{
                headers: ["시간", "방문자", "조회"],
                rows: data.hourlyToday.map((h) => [`${h.hour}시`, `${fmt(h.visitors)}명`, `${fmt(h.pageViews)}회`]),
              }}
            />
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card title="유입 경로">
            <RankList
              unit="회"
              emptyText="기록이 없습니다."
              items={data.referrers.map((r) => ({ key: r.key ?? "(direct)", label: referrerLabel(r.key), count: r.count }))}
              note="방문(세션)을 시작한 곳 기준. 카카오톡·인스타그램 앱 안에서 연 링크는 직접 방문으로 잡히기도 합니다."
            />
          </Card>
          <Card title="기기">
            <RankList
              unit="명"
              emptyText="기록이 없습니다."
              items={data.devices.map((d) => ({ key: d.key, label: DEVICE_LABELS[d.key] ?? d.key, count: d.count }))}
            />
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card title={`구매 단계 (${rangeLabel})`}>
          <FunnelSteps funnel={data.funnel} />
        </Card>
        <Card title={`캠페인별 성과 (${rangeLabel})`}>
          <CampaignTable campaigns={data.campaigns} />
        </Card>
      </div>

      <Card title={`많이 본 상품 (${rangeLabel})`} className="mt-4">
        {data.topProducts.length === 0 ? (
          <Empty>상품 조회 기록이 없습니다.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={`${thClass} w-8`}>#</th>
                  <th className={thClass}>상품</th>
                  <th className={`${thClass} text-right`}>조회</th>
                  <th className={`${thClass} text-right`}>방문자</th>
                  <th className={`${thClass} text-right`}>판매 수량</th>
                  <th className={`${thClass} text-right`} title="판매 수량 ÷ 상품을 본 방문자">
                    구매율
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p, i) => (
                  <tr key={p.productId}>
                    <td className={`${tdClass} tabular-nums text-ink-subtle`}>{i + 1}</td>
                    <td className={tdClass}>
                      <a
                        href={`/products/${p.slug}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-w-[200px] items-center gap-3 hover:underline"
                      >
                        <span className="h-12 w-10 flex-none overflow-hidden rounded bg-black/[0.04]">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- 관리자 목록 썸네일
                            <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </span>
                        <span className="truncate text-ink-body">{p.name}</span>
                      </a>
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`}>{fmt(p.views)}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>{fmt(p.visitors)}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>{fmt(p.purchased)}개</td>
                    <td className={`${tdClass} text-right tabular-nums text-ink-primary`}>
                      {p.visitors > 0 ? `${((p.purchased / p.visitors) * 100).toFixed(1)}%` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[12px] text-ink-subtle">
          판매 수량은 같은 기간에 결제가 끝난 주문 기준입니다. 구매율은 판매 수량을 상품을 본 방문자 수로 나눈 대략적인 값입니다.
        </p>
      </Card>

      <Card title={`많이 본 페이지 (${rangeLabel})`} className="mt-4">
        {data.topPages.length === 0 ? (
          <Empty>페이지 조회 기록이 없습니다.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={`${thClass} w-8`}>#</th>
                  <th className={thClass}>페이지</th>
                  <th className={thClass}>종류</th>
                  <th className={`${thClass} text-right`}>조회</th>
                  <th className={`${thClass} text-right`}>방문자</th>
                </tr>
              </thead>
              <tbody>
                {data.topPages.map((p, i) => (
                  <tr key={p.path}>
                    <td className={`${tdClass} tabular-nums text-ink-subtle`}>{i + 1}</td>
                    <td className={`${tdClass} max-w-[360px]`}>
                      <p className="truncate text-ink-body">{pageLabel(p)}</p>
                      <p className="truncate text-[12px] text-ink-subtle">{p.path}</p>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <Chip tone={p.pageType === "PRODUCT" ? "brand" : "neutral"}>{PAGE_TYPE_LABELS[p.pageType] ?? p.pageType}</Chip>
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`}>{fmt(p.views)}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>{fmt(p.visitors)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

/** 방문 → 상품 → 담기 → 주문서 → 결제하기 → 결제 완료. 각 단계가 전체 방문의 몇 %인지와 앞 단계 대비 비율. */
function FunnelSteps({ funnel }: { funnel: Analytics["funnel"] }) {
  const steps = [
    { label: "방문", value: funnel.sessions },
    { label: "상품 상세를 봄", value: funnel.productSessions },
    { label: "장바구니에 담음", value: funnel.cartSessions },
    { label: "주문서를 엶", value: funnel.checkoutPageSessions },
    { label: "결제하기를 누름", value: funnel.checkoutStartSessions },
    { label: "결제 완료", value: funnel.purchaseSessions },
  ];
  if (funnel.sessions === 0) return <Empty>이 기간에 기록된 방문이 없습니다.</Empty>;

  return (
    <>
      <ol className="space-y-3">
        {steps.map((step, i) => {
          const share = (step.value / funnel.sessions) * 100;
          const prev = i > 0 ? steps[i - 1].value : 0;
          return (
            <li key={step.label} className="text-[13px]">
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate text-ink-body">{step.label}</span>
                <span className="flex-none tabular-nums text-ink-primary">{fmt(step.value)}회</span>
                <span className="w-12 flex-none text-right tabular-nums text-ink-subtle">{share.toFixed(share < 10 ? 1 : 0)}%</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-black/[0.05]">
                <div className="h-full rounded-full" style={{ width: `${Math.max(share, step.value > 0 ? 1 : 0)}%`, backgroundColor: BAR_COLOR }} />
              </div>
              {i > 0 ? (
                <p className="mt-1 text-[11px] text-ink-subtle">
                  앞 단계의 {prev > 0 ? `${((step.value / prev) * 100).toFixed(0)}%` : "-"}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[12px] text-ink-subtle">
        방문(30분 단위) 기준이며, 결제 완료 {fmt(funnel.purchases)}건 · {fmt(funnel.revenue)}원. 담기·결제 기록은 이 기능을 배포한 뒤부터 쌓입니다.
      </p>
    </>
  );
}

/** ?from= 캠페인별 방문과 그 방문 안의 상품 조회·담기·결제. */
function CampaignTable({ campaigns }: { campaigns: Analytics["campaigns"] }) {
  return (
    <>
      {campaigns.length === 0 ? (
        <Empty>아직 캠페인 링크로 들어온 방문이 없습니다.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>캠페인</th>
                <th className={`${thClass} text-right`}>방문</th>
                <th className={`${thClass} text-right`}>상품 조회</th>
                <th className={`${thClass} text-right`}>담기</th>
                <th className={`${thClass} text-right`}>결제</th>
                <th className={`${thClass} text-right`}>매출</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.campaign}>
                  <td className={`${tdClass} max-w-[200px] truncate text-ink-body`}>{c.campaign}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{fmt(c.sessions)}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>
                    {fmt(c.productSessions)}
                    <span className="ml-1 text-[11px] text-ink-subtle">{pct(c.productSessions, c.sessions)}</span>
                  </td>
                  <td className={`${tdClass} text-right tabular-nums`}>{fmt(c.cartSessions)}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{fmt(c.purchaseSessions)}</td>
                  <td className={`${tdClass} text-right tabular-nums text-ink-primary`}>{fmt(c.revenue)}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-[12px] text-ink-subtle">
        인스타 게시물·스토리 링크 뒤에 <code className="rounded bg-black/[0.05] px-1">?from=이름</code>을 붙이면 여기서 나뉘어 보입니다.
        예: <code className="rounded bg-black/[0.05] px-1">eatomato.kr/products/mel-tg?from=post-1107</code>
      </p>
    </>
  );
}

const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "");

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <p className="text-[13px] text-ink-subtle">{label}</p>
      <p className="mt-1 text-[24px] font-semibold tracking-[-0.5px] text-ink-primary tabular-nums">{value}</p>
      {sub ? <p className="mt-1 text-[13px] text-ink-muted">{sub}</p> : null}
    </Card>
  );
}

/** 순위 막대 목록(단일 계열). 이름·숫자는 본문 글자색, 막대는 비율만 보여 준다. */
function RankList({
  items,
  unit,
  emptyText,
  note,
}: {
  items: Array<{ key: string; label: string; count: number }>;
  unit: string;
  emptyText: string;
  note?: string;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const max = Math.max(...items.map((i) => i.count), 0);
  if (items.length === 0 || total === 0) return <Empty>{emptyText}</Empty>;

  return (
    <>
      <ul className="space-y-3">
        {items.slice(0, 8).map((item) => {
          const share = (item.count / total) * 100;
          return (
            <li key={item.key} className="text-[13px]">
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate text-ink-body">{item.label}</span>
                <span className="flex-none tabular-nums text-ink-primary">
                  {fmt(item.count)}
                  {unit}
                </span>
                <span className="w-12 flex-none text-right tabular-nums text-ink-subtle">{share.toFixed(0)}%</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-black/[0.05]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${max > 0 ? (item.count / max) * 100 : 0}%`, backgroundColor: BAR_COLOR }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {items.length > 8 ? <p className="mt-3 text-[12px] text-ink-subtle">외 {items.length - 8}곳</p> : null}
      {note ? <p className="mt-3 text-[12px] text-ink-subtle">{note}</p> : null}
    </>
  );
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

const shortDate = (date: string) => date.slice(5).replace("-", "/");

/** 막대 수에 맞춰 날짜 라벨 간격을 벌린다(라벨끼리 붙지 않게). */
const labelStep = (count: number) => (count <= 7 ? 1 : count <= 14 ? 2 : count <= 31 ? 5 : 14);

/** 잘 알려진 유입 호스트는 이름으로 묶어 보여 준다. */
function referrerLabel(host: string | null): string {
  if (!host) return "직접 방문";
  const known: Array<[RegExp, string]> = [
    [/(^|\.)naver\.com$/, "네이버"],
    [/(^|\.)google\.[a-z.]+$/, "구글"],
    [/(^|\.)(daum\.net|kakao\.com)$/, "다음·카카오"],
    [/(^|\.)instagram\.com$/, "인스타그램"],
    [/(^|\.)facebook\.com$/, "페이스북"],
    [/(^|\.)(youtube\.com|youtu\.be)$/, "유튜브"],
    [/(^|\.)bing\.com$/, "빙"],
  ];
  const hit = known.find(([pattern]) => pattern.test(host));
  return hit ? `${hit[1]} (${host})` : host;
}

function pageLabel(page: Analytics["topPages"][number]): string {
  if (page.pageType === "PRODUCT") return page.productName ?? page.path;
  if (page.pageType === "CATEGORY") {
    const [, , category, sub] = page.path.split("/");
    const resolved = category ? resolveCategory(category, sub) : null;
    if (resolved) {
      return resolved.subcategory.slug ? `${resolved.category.label} · ${resolved.subcategory.label}` : resolved.category.label;
    }
  }
  return PAGE_TYPE_LABELS[page.pageType] ?? page.path;
}
