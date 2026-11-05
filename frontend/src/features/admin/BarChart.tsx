"use client";

import { useEffect, useRef, useState } from "react";

import { formatCompact } from "./format";

export type Bar = {
  key: string;
  value: number;
  /** x 축 라벨. 비우면 그 칸에는 라벨을 찍지 않는다. */
  axisLabel?: string;
  /** 툴팁 첫 줄(값). */
  title: string;
  /** 툴팁 둘째 줄(날짜·보조 값). */
  sub: string;
};

const HEIGHT = 220;
const PAD = { top: 12, right: 8, bottom: 28, left: 48 };
/** 막대는 24px 를 넘지 않게 두고 남는 폭은 여백으로 남긴다. */
const MAX_BAR = 24;
const BAR_COLOR = "#a34d38"; // brand-deep. 흰 카드 위 대비 검증(validate_palette) 통과

/**
 * 단일 계열 막대 차트(범례 없이 카드 제목이 계열을 말한다). 대시보드·방문자 분석이 같이 쓴다.
 *
 * - 막대: 윗면만 4px 둥글게, 기준선에서 자란다.
 * - 막대마다 hover/focus 툴팁(값이 앞, 날짜가 뒤). 히트 영역은 막대보다 넓게 칸 전체.
 * - 툴팁 없이도 값을 읽을 수 있도록 "표로 보기" 를 둔다.
 */
export function BarChart({
  bars,
  ariaLabel,
  table,
  formatTick = formatCompact,
  emptyMax = 3,
}: {
  bars: Bar[];
  ariaLabel: string;
  /** "표로 보기" 의 머리글과 행. */
  table: { headers: string[]; rows: string[][] };
  formatTick?: (value: number) => string;
  /** 값이 모두 0 일 때 축 눈금의 최댓값. */
  emptyMax?: number;
}) {
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // 카드 폭에 맞춰 다시 그린다. 표 보기에서 돌아오면 새 요소를 다시 관찰한다.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [asTable]);

  const max = Math.max(...bars.map((b) => b.value), 0);
  const ticks = niceTicks(max > 0 ? max : emptyMax);
  const top = ticks[ticks.length - 1] || 1;

  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(bars.length, 1);
  const barW = Math.min(MAX_BAR, slot * 0.6);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;

  const activeBar = active === null ? null : bars[active];

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          className="text-[12px] text-ink-subtle underline-offset-2 hover:text-ink-body hover:underline"
        >
          {asTable ? "차트로 보기" : "표로 보기"}
        </button>
      </div>

      {asTable ? (
        <div className="max-h-[320px] overflow-y-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-ink-subtle">
                {table.headers.map((h, i) => (
                  <th key={h} className={`py-1.5 font-medium ${i > 0 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {table.rows.map((row) => (
                <tr key={row[0]} className="border-t border-black/5">
                  {row.map((cell, i) => (
                    <td key={i} className={`py-1.5 ${i > 0 ? "text-right" : ""}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative" ref={boxRef}>
          <svg width={width} height={HEIGHT} role="img" aria-label={ariaLabel}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="#ececec" strokeWidth={1} />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-subtle text-[11px] tabular-nums">
                  {formatTick(t)}
                </text>
              </g>
            ))}
            {bars.map((b, i) => {
              const cx = PAD.left + slot * i + slot / 2;
              const h = PAD.top + plotH - y(b.value);
              return (
                <g
                  key={b.key}
                  tabIndex={0}
                  role="img"
                  aria-label={`${b.sub} ${b.title}`}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="outline-none"
                >
                  {/* 히트 영역: 칸 전체 */}
                  <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={plotH} fill="transparent" />
                  {h > 0 ? (
                    <path
                      d={roundedTopBar(cx - barW / 2, y(b.value), barW, h, 4)}
                      fill={BAR_COLOR}
                      opacity={active === null || active === i ? 1 : 0.55}
                    />
                  ) : null}
                  {b.axisLabel ? (
                    <text x={cx} y={HEIGHT - 8} textAnchor="middle" className="fill-ink-subtle text-[11px] tabular-nums">
                      {b.axisLabel}
                    </text>
                  ) : null}
                </g>
              );
            })}
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={PAD.top + plotH}
              y2={PAD.top + plotH}
              stroke="#d4d4d4"
              strokeWidth={1}
            />
          </svg>

          {activeBar && active !== null ? (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-black/10 bg-white px-3 py-2 text-[12px] shadow-md"
              style={{
                left: Math.min(Math.max(PAD.left + slot * active + slot / 2, 90), width - 90),
                top: Math.max(y(activeBar.value) - 58, 0),
              }}
            >
              <p className="text-[14px] font-bold text-ink-primary">{activeBar.title}</p>
              <p className="text-ink-subtle">{activeBar.sub}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** 0 부터 시작하는 깔끔한 눈금(1·2·5 × 10ⁿ 간격, 4~5개). 값이 작으면(방문자 수 등) 정수 눈금을 쓴다. */
function niceTicks(max: number): number[] {
  const rough = max / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * power).find((s) => s >= rough) ?? power * 10);
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.999; v += step) ticks.push(v);
  return ticks;
}

/** 윗면 모서리만 둥근 막대 경로. 기준선 쪽은 각지게 둔다. */
function roundedTopBar(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.min(r, w / 2, h);
  return [
    `M${x},${y + h}`,
    `V${y + radius}`,
    `Q${x},${y} ${x + radius},${y}`,
    `H${x + w - radius}`,
    `Q${x + w},${y} ${x + w},${y + radius}`,
    `V${y + h}`,
    "Z",
  ].join(" ");
}
