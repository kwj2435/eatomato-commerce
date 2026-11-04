/**
 * 공지 제목·본문을 화면용으로 나누는 규칙.
 *
 * 관리자는 지금처럼 글을 쓰면 되고(데이터 형식은 그대로), 화면에서만 아래 규칙으로 꾸민다.
 */

/** 제목 앞 "[안내] " 같은 말머리를 분류로 떼어 낸다. 말머리가 없으면 category 는 null. */
export function parseNoticeTitle(raw: string): { category: string | null; title: string } {
  const match = raw.match(/^\s*\[([^\]]+)\]\s*/);
  if (!match) return { category: null, title: raw.trim() };
  const title = raw.slice(match[0].length).trim();
  return { category: match[1].trim(), title: title || raw.trim() };
}

export type NoticeBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "note"; items: string[] };

const HEADING = /^[●■◆▶]\s*/;
// "-" 는 "-1,000원" 같은 글과 헷갈리지 않게 뒤에 공백이 있을 때만 목록으로 본다.
const LIST = /^(?:[·•‧∙]\s*|-\s+)/;
const NOTE = /^※\s*/;

/**
 * 본문 문단을 블록으로 묶는다.
 * - ●(■◆▶)로 시작: 소제목
 * - ·(•, "- ")로 시작: 목록. 연속된 줄은 한 목록으로 묶는다.
 * - ※로 시작: 안내 박스. 연속된 줄은 한 박스로 묶는다.
 * - 그 밖: 일반 문단
 */
export function toNoticeBlocks(paragraphs: string[]): NoticeBlock[] {
  const blocks: NoticeBlock[] = [];
  for (const raw of paragraphs) {
    const line = raw.trim();
    if (!line) continue;
    const last = blocks[blocks.length - 1];
    if (HEADING.test(line)) {
      blocks.push({ kind: "heading", text: line.replace(HEADING, "") });
    } else if (LIST.test(line)) {
      const item = line.replace(LIST, "");
      if (last?.kind === "list") last.items.push(item);
      else blocks.push({ kind: "list", items: [item] });
    } else if (NOTE.test(line)) {
      const item = line.replace(NOTE, "");
      if (last?.kind === "note") last.items.push(item);
      else blocks.push({ kind: "note", items: [item] });
    } else {
      blocks.push({ kind: "paragraph", text: line });
    }
  }
  return blocks;
}
