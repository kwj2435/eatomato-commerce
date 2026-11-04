import { cn } from "@/lib/utils/cn";

type NoticeTagProps = { kind: "pinned" } | { kind: "category"; label: string };

/**
 * 공지 태그. 고정 공지는 브랜드 레드, 분류는 말머리 글자로 색을 고른다.
 * "이벤트"는 눈에 띄게 연한 레드, 그 밖(안내 등)은 웜그레이.
 */
export function NoticeTag(props: NoticeTagProps) {
  const label = props.kind === "pinned" ? "공지" : props.label;
  const tone =
    props.kind === "pinned"
      ? "bg-brand-primary text-ink-inverse"
      : props.label.includes("이벤트")
        ? "bg-[#FBE2DA] text-brand-primary"
        : "bg-[#ECE7E5] text-[#5A504C]";
  return (
    <span className={cn("inline-flex h-[22px] items-center whitespace-nowrap px-2 text-[11.5px] font-semibold", tone)}>
      {label}
    </span>
  );
}
