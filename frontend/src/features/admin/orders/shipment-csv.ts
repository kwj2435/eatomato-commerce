import { formatPhone } from "@/lib/utils/format";
import type { AdminOrder } from "@/types/admin";

import { formatDateTime } from "../format";

const HEADERS = [
  "주문번호",
  "결제일시",
  "받는 분",
  "연락처",
  "우편번호",
  "주소",
  "상세주소",
  "배송 요청사항",
  "상품",
  "총 수량",
  "주문자 아이디",
];

/** 배송 화면용 옵션 문구. 추가 금액 표기("(+4,000원)")는 포장과 상관없어 뺀다. */
export function optionText(option?: string): string | undefined {
  return option?.replace(/\s*\([+-][\d,]+원\)/g, "") || undefined;
}

/** "상품명 (옵션) x수량" 을 " / " 로 이은 한 칸. 택배 접수 양식의 "품목" 칸에 그대로 쓴다. */
export function itemsText(order: AdminOrder): string {
  return order.items.map((i) => `${i.name}${optionText(i.option) ? ` (${optionText(i.option)})` : ""} x${i.quantity}`).join(" / ");
}

export function totalQuantity(order: AdminOrder): number {
  return order.items.reduce((sum, i) => sum + i.quantity, 0);
}

function cell(value: string | number): string {
  let text = String(value);
  // 엑셀이 수식으로 실행하지 않게(=, +, -, @ 로 시작하는 값) 앞에 ' 를 붙인다.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * 배송용 CSV. 주문 1건 = 1줄(택배 1상자). 엑셀에서 한글이 깨지지 않게 BOM 을 붙이고,
 * 0 으로 시작하는 우편번호가 숫자로 바뀌어 앞자리 0 이 사라지지 않게 ="06234" 형태로 넣는다.
 */
export function shipmentCsv(orders: AdminOrder[]): string {
  const rows = orders.map((o) => {
    const s = o.shipping;
    return [
      cell(o.orderNumber),
      cell(formatDateTime(o.paidAt ?? o.orderedAt)),
      cell(s?.recipientName ?? o.member?.name ?? ""),
      cell(s ? formatPhone(s.recipientPhone) : ""),
      s ? `="${s.zipCode.replace(/\D/g, "")}"` : "",
      cell(s?.roadAddress ?? ""),
      cell(s?.detailAddress ?? ""),
      cell(s?.deliveryMemo ?? ""),
      cell(itemsText(o)),
      cell(totalQuantity(o)),
      cell(o.member?.loginId ?? ""),
    ].join(",");
  });
  return "﻿" + [HEADERS.join(","), ...rows].join("\r\n") + "\r\n";
}

export function downloadCsv(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
