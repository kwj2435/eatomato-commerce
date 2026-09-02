type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[]
  | { [key: string]: unknown };

/**
 * 조건부 클래스 결합 헬퍼.
 *
 * clsx 의 축약 버전으로, 외부 의존성 없이 문자열/배열/객체 형태의 클래스 인자를 병합한다.
 * 대규모 프로젝트에서는 `clsx + tailwind-merge` 조합을 쓰지만, 프로젝트 초기에는
 * 이 정도로 충분하고 어떤 원리인지 학습하기에도 좋다.
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input));
      continue;
    }

    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) classes.push(nested);
      continue;
    }

    if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(" ");
}
