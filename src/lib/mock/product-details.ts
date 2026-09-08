import { MOCK_PRODUCTS } from "@/lib/mock/products";
import { tomatoImage } from "@/lib/mock/tomato-images";
import type { CategoryKey } from "@/types/product";
import type { OptionGroup, ProductDetail, ProductReview } from "@/types/product-detail";

/**
 * 상세 페이지 mock.
 *
 * 리스트용 상품 데이터(MOCK_PRODUCTS)에 옵션·리뷰·상세 이미지를 덧붙여 상세 페이지에 필요한 형태로 만든다.
 * 실서비스에서는 `getProductDetail(slug)` 가 서버 응답을 그대로 반환한다.
 *
 * mock 규칙:
 * - 옵션 그룹은 카테고리에 따라 다르게 준비 — 케이스에는 색상/부착타입/기종, 액세서리에는 옵션 1~2개,
 *   세트에는 케이스가 포함되므로 기종 선택이 필요하다.
 * - BETTER TOGETHER 후보는 mock 상품 목록에서 자기 자신을 제외하고 2건을 뽑아 붙인다.
 * - 리뷰는 4건 시딩, 평균 5점 고정(모든 mock 상품 공통 — 실 데이터로 대체 예정).
 */

const CASE_OPTION_GROUPS: OptionGroup[] = [
  {
    id: "color",
    label: "색상",
    choices: [
      { id: "cream", label: "크림", priceDelta: 0 },
      { id: "red", label: "레드", priceDelta: 0 },
    ],
  },
  {
    id: "mount",
    label: "부착타입",
    choices: [
      { id: "basic", label: "일반", priceDelta: 0 },
      { id: "macsafe", label: "맥세이프 (+4,000원)", priceDelta: 4_000 },
    ],
  },
  {
    id: "model",
    label: "기종",
    choices: [
      { id: "iphone-17", label: "아이폰 17", priceDelta: 0 },
      { id: "iphone-17-air", label: "아이폰 17 AIR", priceDelta: 0 },
      { id: "iphone-17-pro", label: "아이폰 17 PRO", priceDelta: 0 },
      { id: "iphone-17-promax", label: "아이폰 17 PROMAX", priceDelta: 0 },
    ],
  },
];

const ACC_OPTION_GROUPS: OptionGroup[] = [
  {
    id: "color",
    label: "색상",
    choices: [
      { id: "cream", label: "크림", priceDelta: 0 },
      { id: "red", label: "레드", priceDelta: 0 },
    ],
  },
  {
    id: "type",
    label: "부착타입",
    choices: [
      { id: "basic", label: "일반", priceDelta: 0 },
      { id: "macsafe", label: "맥세이프 (+4,000원)", priceDelta: 4_000 },
    ],
  },
];

/**
 * 세트 상품 옵션.
 * 케이스가 포함되어 기종 선택이 필수이고, 구성품은 고정이라 부착타입은 받지 않는다.
 */
const SET_OPTION_GROUPS: OptionGroup[] = [
  {
    id: "color",
    label: "색상",
    choices: [
      { id: "cream", label: "크림", priceDelta: 0 },
      { id: "red", label: "레드", priceDelta: 0 },
    ],
  },
  {
    id: "model",
    label: "기종",
    choices: [
      { id: "iphone-17", label: "아이폰 17", priceDelta: 0 },
      { id: "iphone-17-air", label: "아이폰 17 AIR", priceDelta: 0 },
      { id: "iphone-17-pro", label: "아이폰 17 PRO", priceDelta: 0 },
      { id: "iphone-17-promax", label: "아이폰 17 PROMAX", priceDelta: 0 },
    ],
  },
];

/** 카테고리별 옵션 그룹 매핑. 카테고리가 늘어나면 여기만 채우면 된다. */
const OPTION_GROUPS_BY_CATEGORY: Record<CategoryKey, OptionGroup[]> = {
  "phone-case": CASE_OPTION_GROUPS,
  "phone-acc": ACC_OPTION_GROUPS,
  set: SET_OPTION_GROUPS,
};

const NOTICE_LINES = [
  "eatomato의 모든 제품은 주문 후 제작 상품입니다.",
  "주문 확인 후 순차적으로 제작되며",
  "제작기간은 평균 3~7일(영업일 기준) 정도 소요됩니다. (주말 및 공휴일 제외)",
  "제작 후 배송기간은 추가 3~5일 소요되며,",
  "택배사의 배송 상황에 따라 추가 배송 기간이 발생할 수 있습니다.",
];

const SEED_REVIEWS: ProductReview[] = [
  {
    id: "r-1",
    writer: "김**",
    rating: 5,
    content: "사이드에 미끄러움 방지도 있고 값어치 합니다! 완전 추천합니다.",
    isBest: true,
  },
  {
    id: "r-2",
    writer: "네******",
    rating: 5,
    content:
      "털가죽을 확대한 느낌ㅎㅎ 시크한 느낌 찾고 있었는데 너무 이뻐요ㅠㅠ 미드멀리는 깔끔해서 더 이쁜 거 같아요.",
    isBest: true,
  },
  {
    id: "r-3",
    writer: "문**",
    rating: 5,
    content: "기엽고 튼튼함 디테일 있고 내구성이 좋아 실용성도 만족스러움",
    isBest: true,
  },
  {
    id: "r-4",
    writer: "이**",
    rating: 5,
    content:
      "홈페이지랑 흡사하긴 한데 실물이 더 예뻐요ㅠㅠㅠ 실버 테두리가 트렌디하고 예뻐요ㅠㅠ",
    isBest: true,
  },
];

/**
 * 슬러그 → 상세 매핑.
 * 즉시 계산이 가벼우므로 첫 접근 시 렌더 컨텍스트에서 만들어도 되지만,
 * 모듈 스코프에서 한 번만 만들어 재사용해 SSR 요청 간 캐시 이점을 얻는다.
 */
const DETAILS_BY_SLUG = new Map<string, ProductDetail>(
  MOCK_PRODUCTS.map((product, idx) => {
    const optionGroups = OPTION_GROUPS_BY_CATEGORY[product.category];

    const betterTogether = MOCK_PRODUCTS.filter((p) => p.id !== product.id)
      .slice(0, 2)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        salePrice: p.salePrice,
        imageUrl: p.imageUrl,
        optionGroups,
      }));

    const detail: ProductDetail = {
      ...product,
      noticeLines: NOTICE_LINES,
      rewardRate: 3,
      shippingLines: NOTICE_LINES,
      optionGroups,
      betterTogether,
      detailImages: [
        tomatoImage(idx * 2, { width: 1200, height: 1600, quality: 75 }),
        tomatoImage(idx * 2 + 1, { width: 1200, height: 1600, quality: 75 }),
      ],
      reviews: SEED_REVIEWS.map((r, i) => ({
        ...r,
        imageUrl:
          i < 3 ? tomatoImage(idx + i, { width: 210, height: 210 }) : undefined,
      })),
      reviewCount: 390,
    };
    return [product.slug, detail];
  }),
);

export function findMockProductDetail(slug: string): ProductDetail | null {
  return DETAILS_BY_SLUG.get(slug) ?? null;
}

export function listMockProductSlugs(): string[] {
  return Array.from(DETAILS_BY_SLUG.keys());
}
