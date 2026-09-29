"use client";

/**
 * next/image 로더.
 *
 * 예전에는 최적화를 꺼(unoptimized) 모바일에도 원본 크기 이미지를 받아 첫 화면이 느렸다.
 * VM 메모리가 작아 Next 서버에서 직접 리사이즈(sharp)하지 않고, 이미지 서버의 리사이즈 기능을 쓴다.
 * - Unsplash(데모 이미지): w·h·q 파라미터를 화면 너비에 맞게 바꾼다(가로세로 비율 유지).
 * - 업로드 파일(/uploads/…): 아직 리사이즈 서버가 없어 원본 그대로. 업로드 시 리사이즈를 붙이면 여기서 분기한다.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  try {
    const url = new URL(src, "http://local");
    if (url.hostname === "images.unsplash.com") {
      const w = Number(url.searchParams.get("w"));
      const h = Number(url.searchParams.get("h"));
      url.searchParams.set("w", String(width));
      if (w > 0 && h > 0) url.searchParams.set("h", String(Math.round((h * width) / w)));
      url.searchParams.set("q", String(quality ?? 70));
      url.searchParams.set("auto", "format");
      return url.toString();
    }
  } catch {
    // URL 로 읽을 수 없는 값은 그대로 쓴다.
  }
  // next/image 는 로더 결과에 너비가 드러나길 요구한다. 정적 파일 서버는 쿼리를 무시한다.
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}
