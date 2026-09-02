/**
 * 상품 도메인 타입.
 * API 응답과 UI 가 공유하는 최소 스펙만 정의한다.
 * 실제 API 연동 시에도 이 타입을 계약으로 삼아 mock ↔ real 전환이 가능하다.
 */
export type ProductBadge = "NEW" | "BEST" | "SALE";

/** 최상위 카테고리 키. GNB · 라우트 · 상품 데이터가 공유하는 리터럴. */
export type CategoryKey = "phone-case" | "phone-acc";

/** 서브카테고리 키. `null` 은 "전체" 를 의미한다(URL 상 세그먼트 없음). */
export type SubcategoryKey =
  | "epoxy-glass"
  | "clear-jelly"
  | "tok"
  | "card-wallet"
  | "airpods-case";

export type Product = {
  id: string;
  name: string;
  /** 옵션 라벨. 예: "맥세이프" */
  option?: string;
  /** 정상가(원). 할인이 있을 경우 `salePrice` 를 표시하고 이 값은 취소선으로 보여준다. */
  price: number;
  salePrice?: number;
  /** 대표 이미지 URL. 목업에서는 비어 있어 placeholder 를 노출한다. */
  imageUrl?: string;
  /** 리스트에서 마우스 오버 시 교체될 서브 이미지. 없으면 default 유지. */
  hoverImageUrl?: string;
  /** 상세 페이지 라우트에 쓸 slug. */
  slug: string;
  badges?: ProductBadge[];
  category: CategoryKey;
  /** 서브카테고리. 없으면 카테고리 최상위. */
  subcategory?: SubcategoryKey;
  /** 정렬용 지표(목업 전용). 실제 API 는 서버에서 정렬해 반환한다. */
  salesCount: number;
  rating: number;
};
