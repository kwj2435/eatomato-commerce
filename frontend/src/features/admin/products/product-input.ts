import type { AdminProduct, AdminProductInput } from "@/types/admin";
import type { ProductBadge } from "@/types/product";

export const BADGES: ProductBadge[] = ["NEW", "BEST", "SALE"];

/** 새 상품 기본값. 배송/제작 안내는 기존 상품과 같은 문구로 시작한다. */
const DEFAULT_NOTICE = [
  "eatomato의 모든 제품은 주문 후 제작 상품입니다.",
  "주문 확인 후 순차적으로 제작되며",
  "제작기간은 평균 3~7일(영업일 기준) 정도 소요됩니다. (주말 및 공휴일 제외)",
  "제작 후 배송기간은 추가 3~5일 소요되며,",
  "택배사의 배송 상황에 따라 추가 배송 기간이 발생할 수 있습니다.",
].join("\n");

export const EMPTY_PRODUCT: AdminProductInput = {
  slug: "",
  name: "",
  optionSummary: "",
  price: 0,
  salePrice: null,
  imageUrl: "",
  hoverImageUrl: "",
  categoryCode: "phone-case",
  subcategoryCode: "",
  rewardRate: 3,
  stockQuantity: null,
  noticeText: DEFAULT_NOTICE,
  shippingText: DEFAULT_NOTICE,
  visible: true,
  badges: [],
  detailImages: [],
  optionGroups: [],
  relatedProductIds: [],
};

export function toInput(p: AdminProduct): AdminProductInput {
  // 판매량·등록일 같은 읽기 전용 값은 폼(=요청 본문)에 싣지 않는다.
  return {
    slug: p.slug,
    name: p.name,
    optionSummary: p.optionSummary ?? "",
    price: p.price,
    salePrice: p.salePrice,
    imageUrl: p.imageUrl ?? "",
    hoverImageUrl: p.hoverImageUrl ?? "",
    categoryCode: p.categoryCode,
    subcategoryCode: p.subcategoryCode ?? "",
    rewardRate: p.rewardRate,
    stockQuantity: p.stockQuantity,
    noticeText: p.noticeText ?? "",
    shippingText: p.shippingText ?? "",
    visible: p.visible,
    badges: p.badges,
    detailImages: p.detailImages,
    optionGroups: p.optionGroups,
    relatedProductIds: p.relatedProductIds,
  };
}

/**
 * 기존 상품을 새 상품의 초안으로 복사한다. URL(slug)은 겹치면 등록되지 않으므로 뒤에 -copy 를 붙여 둔다.
 * 판매량·리뷰 같은 기록은 따라오지 않는다(새 상품으로 등록되기 때문).
 */
export function copyAsNew(p: AdminProduct): AdminProductInput {
  const input = toInput(p);
  return { ...input, slug: `${p.slug}-copy`.slice(0, 80) };
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** 저장 전에 화면에서 잡을 수 있는 오류. 없으면 null. 서버도 같은 규칙으로 한 번 더 검사한다. */
export function validateProduct(form: AdminProductInput): string | null {
  if (!form.name.trim()) return "상품명을 입력해 주세요.";
  if (!SLUG_PATTERN.test(form.slug)) return "URL(slug)은 영문 소문자·숫자·하이픈으로 입력해 주세요.";
  if (form.salePrice !== null && form.salePrice >= form.price) return "할인가는 정상가보다 낮아야 합니다.";
  return null;
}
