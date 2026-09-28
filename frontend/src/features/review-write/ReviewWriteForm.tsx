"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Container } from "@/components/layout/Container";
import { CameraIcon, ChevronDownIcon, CloseIcon } from "@/components/ui/icons";
import { errorMessage } from "@/lib/api/client";
import {
  createReview,
  listReviewableProducts,
  type ReviewableProduct,
} from "@/lib/api/reviews";
import { useRequireAuth } from "@/lib/store/use-require-auth";
import { cn } from "@/lib/utils/cn";

type Status =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

type Photo = { id: string; file: File; url: string };

/** 첨부 사진 최대 장수. */
const MAX_PHOTOS = 5;
const RATING_OPTIONS = [5, 4, 3, 2, 1] as const;

/**
 * 후기 쓰기 폼 (마이페이지 "후기 쓰러 가기" 진입).
 *
 * 구성: 상품 선택 → 본문 → 사진 첨부 → 목록으로 가기 / 평점 / 저장.
 * 색상은 마이페이지 폼과 같이 `brand-deep`(어두운 붉은색) 하나로 테두리·글씨·버튼을 통일한다.
 *
 * 상품 선택지는 "구매했지만 아직 후기를 쓰지 않은 주문 상품"으로, 로그인 후 브라우저에서 불러온다.
 * 같은 상품을 여러 번 샀을 수 있어 선택 값은 slug 가 아니라 주문 상품 id(orderItemId)다.
 * 저장(`POST /api/reviews`)에 성공하면 마이페이지로 돌아간다.
 */
export function ReviewWriteForm() {
  const fieldId = useId();
  const id = (name: string) => `${fieldId}-${name}`;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ready = useRequireAuth();
  const router = useRouter();
  const [products, setProducts] = useState<ReviewableProduct[]>([]);
  const [pending, setPending] = useState(false);
  const [orderItemId, setOrderItemId] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const hasProducts = products.length > 0;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    listReviewableProducts()
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch((e: unknown) => {
        if (!cancelled) setStatus({ kind: "error", message: errorMessage(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  // 미리보기용 object URL 은 언마운트 시 한꺼번에 해제한다(개별 삭제 시에는 removePhoto 에서 해제).
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url)),
    [],
  );

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, room)
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
      }));
    setPhotos((prev) => [...prev, ...picked]);
    if (files.length > room) {
      setStatus({ kind: "error", message: `사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있습니다.` });
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => {
      const target = prev.find((photo) => photo.id === photoId);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((photo) => photo.id !== photoId);
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!orderItemId) {
      setStatus({
        kind: "error",
        message: hasProducts
          ? "후기를 작성할 상품을 선택해주세요."
          : "구매하신 상품이 있어야 후기를 작성할 수 있습니다.",
      });
      return;
    }
    if (!content.trim()) {
      setStatus({ kind: "error", message: "후기 내용을 입력해주세요." });
      return;
    }
    if (!rating) {
      setStatus({ kind: "error", message: "평점을 선택해주세요." });
      return;
    }

    setPending(true);
    try {
      await createReview({
        orderItemId,
        rating: Number(rating),
        content: content.trim(),
        photos: photos.map((photo) => photo.file),
      });
      setStatus({ kind: "success", message: "후기를 저장했습니다." });
      router.push("/mypage");
    } catch (error) {
      setStatus({ kind: "error", message: errorMessage(error) });
      setPending(false);
    }
  };

  return (
    <Container as="section" aria-labelledby={id("title")} className="pt-[70px] lg:pt-[125px]">
      <h1 id={id("title")} className="sr-only">
        후기 쓰기
      </h1>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="px-5 pb-[70px] pt-[38px] text-brand-deep md:px-[50px]"
      >
        <label
          htmlFor={id("product")}
          className="block text-[18px] leading-[26px] tracking-[-0.2px]"
        >
          상품 이름
        </label>
        <div className="relative mt-3">
          <select
            id={id("product")}
            value={orderItemId}
            onChange={(event) => setOrderItemId(event.target.value)}
            disabled={!hasProducts}
            className={cn(selectClass, "h-[64px] w-full pl-5 pr-12")}
          >
            <option value="">
              {hasProducts ? "상품을 선택해주세요" : "구매하신 상품이 없습니다"}
            </option>
            {products.map((product) => (
              <option key={product.orderItemId} value={product.orderItemId}>
                {product.option ? `${product.name} (${product.option})` : product.name}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2" />
        </div>

        <label htmlFor={id("content")} className="sr-only">
          후기 내용
        </label>
        <textarea
          id={id("content")}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="mt-[30px] block h-[300px] w-full resize-y border-y border-brand-deep bg-transparent px-1 py-5 text-[16px] leading-[26px] tracking-[-0.2px] text-black outline-none placeholder:text-[#A6A2A7] focus:border-brand-secondary md:h-[495px]"
        />

        <div className="mt-[33px] flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photos.length >= MAX_PHOTOS}
            aria-label={`사진 첨부 (${photos.length}/${MAX_PHOTOS})`}
            className="flex h-[88px] w-[88px] flex-none items-center justify-center bg-brand-deep text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <CameraIcon />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(event) => {
              addPhotos(event.target.files);
              // 같은 파일을 지웠다가 다시 고를 수 있도록 값을 비운다.
              event.target.value = "";
            }}
          />

          {photos.map((photo) => (
            <div key={photo.id} className="relative h-[88px] w-[88px] flex-none">
              {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 blob 미리보기라 next/image 최적화 대상이 아니다 */}
              <img
                src={photo.url}
                alt={photo.file.name}
                className="h-full w-full border border-brand-deep object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                aria-label={`${photo.file.name} 삭제`}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-brand-deep text-white"
              >
                <CloseIcon width={10} height={10} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-[44px] flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/mypage"
            className={cn(outlineButtonClass, "w-[180px] justify-center")}
          >
            목록으로 가기
          </Link>

          <div className="flex gap-3">
            <div className="relative">
              <label htmlFor={id("rating")} className="sr-only">
                평점
              </label>
              <select
                id={id("rating")}
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                className={cn(selectClass, "h-[64px] w-[164px] pl-6 pr-10 font-bold")}
              >
                <option value="">평점 주기</option>
                {RATING_OPTIONS.map((score) => (
                  <option key={score} value={score}>
                    {"★".repeat(score)} ({score}점)
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2" />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="h-[64px] w-[138px] bg-brand-deep text-[18px] font-bold tracking-[-0.2px] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "저장 중…" : "저장하기"}
            </button>
          </div>
        </div>

        {status.kind !== "idle" ? (
          <p
            role="status"
            aria-live="polite"
            className={cn(
              "mt-6 text-center text-[14px] tracking-[-0.2px]",
              status.kind === "error" ? "text-brand-primary" : "text-brand-deep",
            )}
          >
            {status.message}
          </p>
        ) : null}
      </form>
    </Container>
  );
}

const selectClass =
  "appearance-none border border-brand-deep bg-transparent text-[18px] tracking-[-0.2px] text-brand-deep outline-none focus:border-brand-secondary disabled:cursor-default disabled:opacity-100";

const outlineButtonClass =
  "flex h-[64px] items-center border border-brand-deep text-[18px] font-bold tracking-[-0.2px] text-brand-deep transition-colors hover:bg-brand-deep hover:text-white";
