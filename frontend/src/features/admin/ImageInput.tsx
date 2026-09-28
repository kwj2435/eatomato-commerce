"use client";

import { useRef, useState } from "react";

import { uploadAdminImage } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";

import { Button, inputClass } from "./ui";

type ImageInputProps = {
  id?: string;
  value: string;
  onChange: (url: string) => void;
  category: "products" | "banners";
};

/**
 * 이미지 URL 입력 + 업로드 버튼 + 미리보기.
 * 파일을 고르면 서버에 올리고 돌려받은 URL 을 값으로 넣는다. 외부 이미지 URL 을 직접 붙여 넣어도 된다.
 */
export function ImageInput({ id, value, onChange, category }: ImageInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      onChange(await uploadAdminImage(file, category));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex gap-3">
      <div className="flex h-[72px] w-[72px] flex-none items-center justify-center overflow-hidden rounded-md border border-black/10 bg-black/[0.03]">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- 임의 URL 미리보기라 next/image 허용 도메인 밖일 수 있다
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[11px] text-ink-subtle">없음</span>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <input
          id={id}
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className={inputClass}
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "올리는 중…" : "파일 올리기"}
          </Button>
          {value ? (
            <Button size="sm" variant="ghost" onClick={() => onChange("")}>
              지우기
            </Button>
          ) : null}
          {error ? <span className="text-[12px] text-brand-primary">{error}</span> : null}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
