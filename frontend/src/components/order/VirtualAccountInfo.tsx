import { bankName } from "@/lib/utils/banks";
import { formatKRW } from "@/lib/utils/format";
import type { VirtualAccount } from "@/types/order";

/**
 * 무통장입금 안내(입금대기 주문). 주문 완료 화면과 마이페이지 주문 내역이 같이 쓴다.
 * 기한 안에 입금하지 않으면 주문이 자동 취소된다.
 */
export function VirtualAccountInfo({
  account,
  amount,
  className,
}: {
  account: VirtualAccount;
  amount: number;
  className?: string;
}) {
  return (
    <dl className={`grid grid-cols-[72px_1fr] gap-y-1.5 text-left text-[13px] tracking-[-0.2px] ${className ?? ""}`}>
      <dt className="text-[#777]">입금 계좌</dt>
      <dd className="font-medium text-black">
        {bankName(account.bankCode)} <span className="tabular-nums">{account.accountNumber}</span>
      </dd>
      {account.customerName ? (
        <>
          <dt className="text-[#777]">예금주</dt>
          <dd>{account.customerName}</dd>
        </>
      ) : null}
      <dt className="text-[#777]">입금 금액</dt>
      <dd className="font-bold tabular-nums">{formatKRW(amount)}</dd>
      {account.dueAt ? (
        <>
          <dt className="text-[#777]">입금 기한</dt>
          <dd>
            {formatDue(account.dueAt)}까지 <span className="text-[#999]">(지나면 주문이 자동 취소됩니다)</span>
          </dd>
        </>
      ) : null}
    </dl>
  );
}

/** 2026.10.10 23:59 (한국 시간) */
function formatDue(iso: string): string {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")} ${get("hour")}:${get("minute")}`;
}
