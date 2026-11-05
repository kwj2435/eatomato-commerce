import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteFrame } from "@/components/layout/SiteFrame";
import {
  CATEGORY_LIST,
  resolveCategory,
} from "@/features/product-list/categories";
import { ProductListView } from "@/features/product-list/ProductListView";
import { ProductDetailView } from "@/features/product-detail/ProductDetailView";
import {
  getProductDetail,
  listAllProductSlugs,
} from "@/lib/api/products";
import { getShippingPolicy } from "@/lib/api/shipping";
import { BASE_OPEN_GRAPH, DEFAULT_OG_IMAGE, SITE_NAME, SITE_NAME_KO, SITE_URL, jsonLd } from "@/lib/site";
import type { ProductDetail } from "@/types/product-detail";

/**
 * `/products/[slug]` — 카테고리 전체 리스트 OR 개별 상품 상세.
 *
 * 슬러그 스페이스가 겹치지 않도록 규칙을 강제한다:
 * - 카테고리 슬러그는 `CATEGORIES` 에 등록된 값 (`phone-case`, `earphone-case` 등) 만 허용.
 * - 상품 슬러그는 그 외 값. mock 데이터에서 카테고리와 이름 충돌이 없도록 유지.
 *
 * 하나의 라우트가 두 화면을 담당하도록 한 이유:
 * - 시안이 `/products/{category}` 와 `/products/{productSlug}` 를 동일 prefix 로 요구한다.
 * - Next.js 는 같은 depth 에 두 개의 dynamic segment 폴더를 허용하지 않는다.
 * - 결과적으로 slug 를 먼저 카테고리로 시도하고, 아니면 상품으로 시도하는 "디스패치 라우트" 가 자연스러운 해법이다.
 * - GNB · 상품 카드 · 카트 등 기존 링크(`/products/phone-case`, `/products/mellow-macsafe`) 도 그대로 유효하다.
 */

type RouteParams = { slug: string };
type PageProps = {
  params: Promise<RouteParams>;
};

export async function generateStaticParams(): Promise<RouteParams[]> {
  const categorySlugs = CATEGORY_LIST.map((c) => ({ slug: c.slug }));
  const productSlugs = (await listAllProductSlugs()).map((slug) => ({ slug }));
  return [...categorySlugs, ...productSlugs];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const asCategory = resolveCategory(slug);
  if (asCategory) {
    return {
      title: asCategory.category.label,
      alternates: { canonical: `/products/${slug}/` },
      openGraph: { ...BASE_OPEN_GRAPH, url: `/products/${slug}/`, title: `${asCategory.category.label} · ${SITE_NAME} ${SITE_NAME_KO}` },
    };
  }

  const product = await getProductDetail(slug);
  if (product) {
    const description = productDescription(product);
    return {
      title: product.name,
      description,
      alternates: { canonical: `/products/${slug}/` },
      openGraph: {
        ...BASE_OPEN_GRAPH,
        url: `/products/${slug}/`,
        title: `${product.name} · ${SITE_NAME} ${SITE_NAME_KO}`,
        description,
        images: product.imageUrl ? [{ url: product.imageUrl, alt: product.name }] : [DEFAULT_OG_IMAGE],
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description,
        images: [product.imageUrl ?? DEFAULT_OG_IMAGE.url],
      },
    };
  }

  return { title: "상품을 찾을 수 없습니다" };
}

export default async function ProductRoute({ params }: PageProps) {
  const { slug } = await params;

  // 1) 카테고리 슬러그면 → 리스트 뷰(전체)
  const asCategory = resolveCategory(slug);
  if (asCategory) {
    return (
      <SiteFrame>
        <ProductListView
          category={asCategory.category}
          activeSubcategory={null}
        />
      </SiteFrame>
    );
  }

  // 2) 상품 슬러그면 → 상세 뷰
  const [product, shippingPolicy] = await Promise.all([getProductDetail(slug), getShippingPolicy()]);
  if (product) {
    return (
      <SiteFrame bottomBarSpace>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd(product)) }} />
        <ProductDetailView product={product} shippingPolicy={shippingPolicy} />
      </SiteFrame>
    );
  }

  // 3) 어느 쪽도 아니면 404
  notFound();
}

/** 검색 결과·공유 미리보기에 쓸 상품 설명. 옵션 요약과 안내 첫 줄을 잇는다. */
function productDescription(product: ProductDetail): string {
  const parts = [`${product.name} — 잇토마토(eatomato) 공식몰`, product.option, product.noticeLines[0]];
  return parts.filter(Boolean).join(" · ").slice(0, 160);
}

/** 상품 구조화 데이터(이름·사진·가격·재고·후기). 후기가 없으면 평점은 넣지 않는다. */
function productJsonLd(product: ProductDetail) {
  const url = `${SITE_URL}/products/${product.slug}/`;
  const images = [product.imageUrl, ...product.detailImages.slice(0, 3)].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url,
    image: images,
    description: productDescription(product),
    sku: product.slug,
    brand: { "@type": "Brand", name: SITE_NAME, alternateName: SITE_NAME_KO },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "KRW",
      price: product.salePrice ?? product.price,
      availability: product.soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
    ...(product.reviewCount > 0 && product.rating > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount } }
      : {}),
  };
}
