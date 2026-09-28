package com.eatomato.backend.seed;

import static com.eatomato.backend.product.ProductBadge.BEST;
import static com.eatomato.backend.product.ProductBadge.NEW;
import static com.eatomato.backend.product.ProductBadge.SALE;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.banner.Banner;
import com.eatomato.backend.banner.BannerRepository;
import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.notice.Notice;
import com.eatomato.backend.notice.NoticeRepository;
import com.eatomato.backend.product.Category;
import com.eatomato.backend.product.CategoryRepository;
import com.eatomato.backend.product.Product;
import com.eatomato.backend.product.ProductBadge;
import com.eatomato.backend.product.ProductOptionGroup;
import com.eatomato.backend.product.ProductRepository;
import com.eatomato.backend.review.Review;
import com.eatomato.backend.review.ReviewRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 프론트 mock(src/lib/mock/*)과 같은 데모 데이터를 넣는다.
 *
 * 상품 테이블이 비어 있을 때 한 번만 실행되므로 재시작해도 중복되지 않는다.
 * 운영 데이터를 직접 관리하게 되면 SEED_DEMO_DATA=false 로 끈다.
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.seed", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
public class DemoDataSeeder implements ApplicationRunner {

	private static final String NOTICE_TEXT = String.join("\n",
		"eatomato의 모든 제품은 주문 후 제작 상품입니다.",
		"주문 확인 후 순차적으로 제작되며",
		"제작기간은 평균 3~7일(영업일 기준) 정도 소요됩니다. (주말 및 공휴일 제외)",
		"제작 후 배송기간은 추가 3~5일 소요되며,",
		"택배사의 배송 상황에 따라 추가 배송 기간이 발생할 수 있습니다.");

	private static final List<String> DEFAULT_NOTICE_BODY = List.of(
		"자세한 내용은 고객센터로 문의해 주세요.",
		"이용에 참고 부탁드립니다. 감사합니다.");

	/** 메인 대표 리뷰로 노출할 상품 slug → 썸네일 이미지 index. 프론트 MOCK_REVIEW_THUMBNAILS 와 같다. */
	private static final Map<String, Integer> FEATURED_REVIEW_IMAGES = Map.of(
		"mellow-macsafe", 9,
		"dottie-cream-red", 10,
		"clear-jelly-hard", 11,
		"card-wallet-classic", 12);

	private final CategoryRepository categoryRepository;
	private final ProductRepository productRepository;
	private final ReviewRepository reviewRepository;
	private final BannerRepository bannerRepository;
	private final NoticeRepository noticeRepository;

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (productRepository.count() > 0) {
			return;
		}
		log.info("데모 데이터를 넣습니다.");
		seedCategories();
		List<Product> products = seedProducts();
		seedReviews(products);
		seedBanners();
		seedNotices();
	}

	private void seedCategories() {
		categoryRepository.saveAll(List.of(
			new Category("phone-case", "Phone Case", 1)
				.addSubcategory("epoxy-glass", "Epoxy & Glass")
				.addSubcategory("clear-jelly", "Clear Jelly Hard"),
			new Category("phone-acc", "Phone ACC", 2)
				.addSubcategory("tok", "Tok")
				.addSubcategory("card-wallet", "Card Wallet")
				.addSubcategory("airpods-case", "Airpods Case"),
			new Category("set", "SET ITEM", 3)));
		categoryRepository.flush();
	}

	private List<Product> seedProducts() {
		List<Product> products = new ArrayList<>(List.of(
			// Phone Case · Epoxy & Glass
			product("mellow-macsafe", "핸드폰 케이스 MELLOW", "옵션 | 맥세이프", 23000, 19000,
				List.of(NEW, BEST), "phone-case", "epoxy-glass", 420, "4.8", 0, 1),
			product("dottie-cream-red", "핸드폰 케이스 DOTTIE (cream / red)", "옵션 | 맥세이프", 23000, 19000,
				List.of(SALE, BEST), "phone-case", "epoxy-glass", 380, "4.7", 2, 3),
			product("mellow-glass-cream", "핸드폰 케이스 MELLOW GLASS", "옵션 | 맥세이프", 25000, 21000,
				List.of(SALE), "phone-case", "epoxy-glass", 210, "4.5", 4, 5),
			// Phone Case · Clear Jelly Hard
			product("clear-jelly-basic", "핸드폰 케이스 CLEAR JELLY", "옵션 | 맥세이프 미지원", 18000, null,
				List.of(NEW), "phone-case", "clear-jelly", 560, "4.6", 6, 7),
			product("clear-jelly-hard", "핸드폰 케이스 CLEAR JELLY HARD", "옵션 | 맥세이프", 22000, 18000,
				List.of(SALE, BEST), "phone-case", "clear-jelly", 640, "4.9", 8, 9),
			product("jelly-airy-tint", "핸드폰 케이스 JELLY AIRY TINT", "옵션 | 맥세이프", 21000, 17500,
				List.of(SALE), "phone-case", "clear-jelly", 190, "4.4", 10, 11),
			// Phone ACC · Tok
			product("tok-cream-round", "톡 CREAM ROUND", "옵션 | 원형", 12000, null,
				List.of(NEW), "phone-acc", "tok", 300, "4.7", 12, 13),
			product("tok-red-square", "톡 RED SQUARE", "옵션 | 사각형", 12000, 9900,
				List.of(SALE), "phone-acc", "tok", 250, "4.5", 14, 0),
			// Phone ACC · Card Wallet
			product("card-wallet-slim", "카드지갑 SLIM", "옵션 | 맥세이프", 19000, null,
				List.of(BEST), "phone-acc", "card-wallet", 470, "4.8", 1, 2),
			product("card-wallet-classic", "카드지갑 CLASSIC", "옵션 | 맥세이프", 24000, 19900,
				List.of(SALE, BEST), "phone-acc", "card-wallet", 520, "4.9", 3, 4),
			// Phone ACC · Airpods Case
			product("airpods-mellow", "에어팟 케이스 MELLOW", "옵션 | 3세대 / Pro", 16000, null,
				List.of(NEW), "phone-acc", "airpods-case", 180, "4.6", 5, 6),
			product("airpods-dottie", "에어팟 케이스 DOTTIE", "옵션 | 3세대 / Pro", 16000, 13500,
				List.of(SALE), "phone-acc", "airpods-case", 140, "4.4", 7, 8),
			// SET ITEM (하위 분류 없음)
			product("set-mellow-tok", "[SET] MELLOW 케이스 + 스마트톡", "옵션 | 맥세이프", 35000, 29900,
				List.of(BEST), "set", null, 410, "4.8", 9, 10),
			product("set-clear-card-wallet", "[SET] CLEAR JELLY HARD 케이스 + 카드지갑", "옵션 | 맥세이프", 41000, 34900,
				List.of(NEW, BEST), "set", null, 330, "4.7", 11, 12),
			product("set-dottie-airpods", "[SET] DOTTIE 케이스 + 에어팟 케이스", "옵션 | 3세대 / Pro", 39000, 32900,
				List.of(SALE), "set", null, 220, "4.6", 13, 14),
			product("set-mellow-full", "[SET] MELLOW 풀세트 (케이스 + 톡 + 에어팟 케이스)", "옵션 | 맥세이프", 51000, 42900,
				List.of(NEW), "set", null, 160, "4.9", 0, 3)));

		for (int i = 0; i < products.size(); i++) {
			Product product = products.get(i);
			addOptionGroups(product);
			product.getDetailImages().addAll(List.of(
				TomatoImages.url(i * 2, 1200, 1600, 75),
				TomatoImages.url(i * 2 + 1, 1200, 1600, 75)));
		}
		productRepository.saveAll(products);

		// BETTER TOGETHER: 자기 자신을 제외한 앞쪽 상품 2건 (프론트 mock 과 같은 규칙)
		for (Product product : products) {
			products.stream().filter(other -> other != product).limit(2).forEach(product::addRelatedProduct);
		}
		return products;
	}

	private static Product product(String slug, String name, String optionSummary, int price, Integer salePrice,
		List<ProductBadge> badges, String category, String subcategory, int salesCount, String rating,
		int imageIndex, int hoverImageIndex) {
		return Product.builder()
			.slug(slug)
			.name(name)
			.optionSummary(optionSummary)
			.price(price)
			.salePrice(salePrice)
			.badges(badges)
			.categoryCode(category)
			.subcategoryCode(subcategory)
			.salesCount(salesCount)
			.rating(new BigDecimal(rating))
			.rewardRate(3)
			.noticeText(NOTICE_TEXT)
			.shippingText(NOTICE_TEXT)
			.imageUrl(TomatoImages.product(imageIndex))
			.hoverImageUrl(TomatoImages.product(hoverImageIndex))
			.build();
	}

	/** 카테고리별 옵션 구성. 프론트 mock(product-details.ts)의 CASE/ACC/SET_OPTION_GROUPS 와 같다. */
	private static void addOptionGroups(Product product) {
		addColor(product.addOptionGroup("color", "색상"));
		switch (product.getCategoryCode()) {
			case "phone-case" -> {
				addMount(product.addOptionGroup("mount", "부착타입"));
				addModel(product.addOptionGroup("model", "기종"));
			}
			case "phone-acc" -> addMount(product.addOptionGroup("type", "부착타입"));
			case "set" -> addModel(product.addOptionGroup("model", "기종"));
			default -> {
			}
		}
	}

	private static void addColor(ProductOptionGroup group) {
		group.addChoice("cream", "크림", 0).addChoice("red", "레드", 0);
	}

	private static void addMount(ProductOptionGroup group) {
		group.addChoice("basic", "일반", 0).addChoice("macsafe", "맥세이프 (+4,000원)", 4_000);
	}

	private static void addModel(ProductOptionGroup group) {
		group.addChoice("iphone-17", "아이폰 17", 0)
			.addChoice("iphone-17-air", "아이폰 17 AIR", 0)
			.addChoice("iphone-17-pro", "아이폰 17 PRO", 0)
			.addChoice("iphone-17-promax", "아이폰 17 PROMAX", 0);
	}

	private void seedReviews(List<Product> products) {
		record Seed(String writer, String content) {
		}
		List<Seed> seeds = List.of(
			new Seed("김**", "사이드에 미끄러움 방지도 있고 값어치 합니다! 완전 추천합니다."),
			new Seed("네******", "털가죽을 확대한 느낌ㅎㅎ 시크한 느낌 찾고 있었는데 너무 이뻐요ㅠㅠ 미드멀리는 깔끔해서 더 이쁜 거 같아요."),
			new Seed("문**", "기엽고 튼튼함 디테일 있고 내구성이 좋아 실용성도 만족스러움"),
			new Seed("이**", "홈페이지랑 흡사하긴 한데 실물이 더 예뻐요ㅠㅠㅠ 실버 테두리가 트렌디하고 예뻐요ㅠㅠ"));

		List<Review> reviews = new ArrayList<>();
		for (int idx = 0; idx < products.size(); idx++) {
			Product product = products.get(idx);
			Integer featuredImage = FEATURED_REVIEW_IMAGES.get(product.getSlug());
			for (int i = 0; i < seeds.size(); i++) {
				boolean featured = featuredImage != null && i == 0;
				List<String> images;
				if (featured) {
					images = List.of(TomatoImages.product(featuredImage));
				} else if (i < 3) {
					images = List.of(TomatoImages.url(idx + i, 210, 210, 80));
				} else {
					images = List.of();
				}
				reviews.add(Review.builder()
					.product(product)
					.writerName(seeds.get(i).writer())
					.rating(5)
					.content(seeds.get(i).content())
					.best(true)
					.featured(featured)
					.images(images)
					.build());
			}
		}
		reviewRepository.saveAll(reviews);
	}

	private void seedBanners() {
		record Seed(String line1, String line2, String href, String alt) {
		}
		List<Seed> seeds = List.of(
			new Seed("메인화면 이미지 클릭하면", "이미지 관련한 제품으로 넘어갈 수 있게", "/products/phone-case", "메인 배너 1 — 핸드폰 케이스 신제품"),
			new Seed("시즌 컬렉션", "감각적인 톤 온 톤을 만나보세요", "/products/phone-acc", "메인 배너 2 — 시즌 컬렉션"),
			new Seed("에어팟 케이스", "새로운 스타일이 추가되었어요", "/products/phone-acc/airpods-case", "메인 배너 3 — 에어팟 케이스"),
			new Seed("세트 상품", "함께 사면 더 예뻐요", "/products/set", "메인 배너 4 — 세트 상품"),
			new Seed("신규 회원 혜택", "지금 가입하고 2,000원 쿠폰 받기", "/register", "메인 배너 5 — 신규 회원 혜택"),
			new Seed("MD's Pick", "이번 주 큐레이션을 확인하세요", "/products/phone-case", "메인 배너 6 — MD 픽"),
			new Seed("카드 지갑 리뉴얼", "슬림해진 데일리 아이템", "/products/phone-acc/card-wallet", "메인 배너 7 — 카드 지갑"));

		List<Banner> banners = new ArrayList<>();
		for (int i = 0; i < seeds.size(); i++) {
			Seed seed = seeds.get(i);
			banners.add(new Banner(List.of(seed.line1(), seed.line2()), seed.href(),
				TomatoImages.url(i, 1440, 814, 75), seed.alt(), i + 1));
		}
		bannerRepository.saveAll(banners);
	}

	private void seedNotices() {
		noticeRepository.saveAll(List.of(
			// 상단 고정 공지 12건
			pinned("[공지] 7월 브랜드 휴무 및 사은품 안내", "2026-07-09T19:21:00+09:00", List.of(
				"7월 브랜드 휴무 기간 동안 주문은 정상 접수되며, 출고는 휴무 종료 후 순차적으로 진행됩니다.",
				"휴무 기간 중 주문하신 분들께는 소정의 사은품을 함께 보내드립니다.")),
			pinned("[공지] 4주년 이벤트 안내", "2026-07-01T19:05:00+09:00", List.of(
				"eatomato 4주년을 맞아 전 상품 할인과 함께 럭키드로우 이벤트를 진행합니다.",
				"기간 내 구매 고객 전원에게 적립금이 자동 지급됩니다.")),
			pinned("Lemon Field 신제품 이벤트 당첨자 발표", "2026-02-23T21:01:00+09:00", DEFAULT_NOTICE_BODY),
			pinned("리뷰 이벤트 당첨 안내 (1월)", "2026-02-02T16:42:00+09:00", DEFAULT_NOTICE_BODY),
			pinned("물류 시스템 재정비 및 배송 일정 안내", "2026-01-19T11:46:00+09:00", List.of(
				"물류 시스템 재정비로 인해 일부 주문의 출고가 1~2일 지연될 수 있습니다.",
				"빠르게 정상화하겠습니다. 너른 양해 부탁드립니다.")),
			pinned("1월 배송 및 CS 휴무 안내", "2026-01-02T08:02:00+09:00", DEFAULT_NOTICE_BODY),
			pinned("고객센터 안내 (CS · Help Center)", "2025-12-20T14:44:00+09:00", List.of(
				"고객센터 운영 시간은 평일 10:00 ~ 17:00 이며, 점심시간 12:30 ~ 13:30 에는 상담이 어렵습니다.",
				"주말 및 공휴일 문의는 다음 영업일에 순차적으로 답변드립니다.")),
			pinned("2026년 회원 등급 정책 변경 안내", "2025-12-14T14:52:00+09:00", DEFAULT_NOTICE_BODY),
			pinned("회원 등급 안내 (~2025.12.31)", "2024-06-10T20:05:00+09:00", DEFAULT_NOTICE_BODY),
			pinned("저작권 관련 (Copyright)", "2022-06-28T01:31:00+09:00", List.of(
				"eatomato 의 모든 디자인과 이미지에 대한 저작권은 eatomato 에 있습니다.",
				"무단 도용 및 2차 가공을 금지합니다.")),
			pinned("배송 안내 (Shipping)", "2022-06-24T13:48:00+09:00", List.of(
				"결제 완료 후 영업일 기준 2~5일 내에 출고됩니다.",
				"80,000원 이상 구매 시 배송비가 무료이며, 미만은 3,000원이 부과됩니다.")),
			pinned("교환 및 반품 안내 (Exchange and Return)", "2022-06-24T13:46:00+09:00", List.of(
				"상품 수령 후 7일 이내에 고객센터로 신청해 주세요.",
				"단순 변심의 경우 왕복 배송비가 부과되며, 사용 흔적이 있는 상품은 교환·반품이 어렵습니다.")),
			// 일반 공지 7건
			numbered(13, "옹시미 배경화면 공유 이벤트 당첨자 안내", "2025-12-14T18:12:00+09:00", DEFAULT_NOTICE_BODY),
			numbered(12, "블랙감사위크 럭키드로우 이벤트 당첨자 안내", "2025-12-14T17:31:00+09:00", DEFAULT_NOTICE_BODY),
			numbered(11, "하드타입 카드 케이스 유의사항 (Card Case)", "2025-12-14T14:58:00+09:00", List.of(
				"카드 수납부는 카드 1~2장 기준으로 제작되어, 그 이상 넣을 경우 늘어남이 발생할 수 있습니다.",
				"하드 소재 특성상 강한 충격에는 파손될 수 있으니 주의해 주세요.")),
			numbered(10, "하드 및 젤하드 케이스 유의사항 (Hard, Clear Case)", "2025-12-14T14:55:00+09:00", List.of(
				"투명 소재는 자외선과 사용 환경에 따라 시간이 지나면 자연스럽게 변색될 수 있습니다.",
				"이는 소재 고유의 특성으로 교환·반품 사유에 해당하지 않습니다.")),
			numbered(6, "에어팟 케이스 유의사항 (Airpods Case)", "2024-02-24T22:02:00+09:00", DEFAULT_NOTICE_BODY),
			numbered(5, "범퍼 케이스 유의 사항 (Bumper Case)", "2024-02-24T21:54:00+09:00", DEFAULT_NOTICE_BODY),
			numbered(4, "스마트톡 부착 방법 및 유의사항 (Phone Grip Guide)", "2024-02-24T21:50:00+09:00", List.of(
				"부착 면의 유분과 먼지를 제거한 뒤 눌러 고정해 주세요. 24시간 후 접착력이 가장 강해집니다.",
				"실리콘·가죽 등 일부 소재에는 부착이 어려울 수 있습니다."))));
	}

	private static Notice pinned(String title, String publishedAt, List<String> body) {
		return new Notice(null, title, "관리자", kst(publishedAt), true, body);
	}

	private static Notice numbered(int number, String title, String publishedAt, List<String> body) {
		return new Notice(number, title, "관리자", kst(publishedAt), false, body);
	}

	private static LocalDateTime kst(String isoOffset) {
		return OffsetDateTime.parse(isoOffset).atZoneSameInstant(Times.KST).toLocalDateTime();
	}
}
