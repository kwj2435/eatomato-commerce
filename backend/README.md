# eatomato-backend

eatomato 커머스 프론트(`eatomato-commerce`, Next.js 정적 export)의 API 서버.
프론트 `src/lib/api/*` 가 지금 mock 으로 돌려주는 데이터를 같은 형태(JSON 필드명·타입)로 내려준다.

- Java 21 · Spring Boot 4.1 · Spring Data JPA · Spring Security(JWT, HS256) · Flyway
- DB: Azure Database for MySQL (`eatomato-db.mysql.database.azure.com`)

## 실행

```bash
# DB 없이 (H2 인메모리 + 데모 데이터)
./gradlew bootRun --args='--spring.profiles.active=local'

# Azure MySQL 로
export DB_USERNAME=... DB_PASSWORD=... JWT_SECRET=$(openssl rand -base64 48)
./gradlew bootRun

./gradlew test   # 통합 테스트 (H2)
```

환경 변수는 `.env.example` 참고. 스키마는 기동 시 Flyway(`src/main/resources/db/migration`)가 만들고,
상품 테이블이 비어 있으면 `DemoDataSeeder` 가 프론트 mock 과 같은 데모 데이터(상품 16·배너 7·공지 19)를 넣는다.

## 배포 (VM)

```bash
cp .env.example .env   # 값 채우기
docker compose up -d --build
```

## 인증

`POST /api/auth/login` 응답의 `accessToken` 을 `Authorization: Bearer <token>` 헤더로 보낸다(기본 2시간 유효).
🔒 표시는 토큰이 필요한 API.

## API

| 메서드 | 경로 | 설명 | 프론트 대응 |
|---|---|---|---|
| GET | `/api/categories` | 카테고리 트리 (첫 서브카테고리는 `{slug:null,label:"All"}`) | `CATEGORY_LIST` |
| GET | `/api/products?category=&subcategory=&sort=` | 카테고리별 목록. sort: `price-asc` `price-desc` `popularity`(기본) `rating` | `listProducts` |
| GET | `/api/products/new?limit=4` | 신상품 (NEW 배지) | `listNewProducts` |
| GET | `/api/products/search?q=&sort=` | 상품명·옵션 검색 | `listSearchableProducts` |
| GET | `/api/products/slugs` | 전체 slug (정적 빌드용) | `listAllProductSlugs` |
| GET | `/api/products/{slug}` | 상세 (옵션·함께구매·리뷰 10건 포함) | `getProductDetail` |
| GET | `/api/products/{slug}/reviews?page=&size=` | 리뷰 페이지 조회 | |
| GET | `/api/banners` | 메인 배너 | `listHeroBanners` |
| GET | `/api/reviews/featured?limit=4` | 메인 대표 리뷰 썸네일 | `listFeaturedReviews` |
| GET | `/api/notices?query=` | 공지 목록 (고정 → 등록일 내림차순, 제목 검색) | `listNotices` |
| GET | `/api/notices/ids` · `/api/notices/{id}` | 공지 id 목록 / 단건 | `listNoticeIds` · `getNotice` |
| POST | `/api/auth/signup` | 가입 `{loginId,password,email,name}` → 토큰 | |
| POST | `/api/auth/login` | 로그인 `{loginId(아이디 또는 이메일),password}` → 토큰 | `LoginForm` |
| GET · PATCH | `/api/me` 🔒 | 회원 정보 조회 / 수정 (null 필드는 유지) | `getMyMember` · `updateMyMember` |
| PUT | `/api/me/password` 🔒 | 비밀번호 변경 | |
| GET | `/api/cart` 🔒 | 장바구니 + 요약(선택 항목 합산, 배송비) | `cart-store` |
| POST | `/api/cart/items` 🔒 | 담기 `{productId, options:{groupId:choiceId}, quantity}` | `addItem` |
| PATCH | `/api/cart/items/{id}` 🔒 | 수량·선택 변경 `{quantity?, selected?}` | `updateQuantity` · `toggleSelected` |
| PUT | `/api/cart/selection` 🔒 | 전체 선택/해제 `{selected}` | `toggleAllSelected` |
| DELETE | `/api/cart/items/{id}` · `/api/cart` 🔒 | 항목 삭제 / 비우기 | `removeItem` · `clear` |
| POST | `/api/orders` 🔒 | 주문 `{cartItemIds?}` (생략 시 선택 항목 전체) | |
| GET | `/api/orders` · `/api/orders/{orderNumber}` 🔒 | 주문 내역 | 마이페이지 주문 내역 |
| GET | `/api/me/reviewable-products` 🔒 | 후기 작성 가능 상품 | `listReviewableProducts` |
| POST | `/api/reviews` 🔒 | 후기 저장 (multipart: `orderItemId`, `rating`, `content`, `photos`≤5) | `ReviewWriteForm` |
| GET | `/api/me/reviews` 🔒 | 내가 쓴 후기 | 마이페이지 내가 쓴 글 |

장바구니 변경 API 는 모두 변경 후의 장바구니 전체를 돌려준다.
에러 응답은 `{ "code": "PRODUCT_NOT_FOUND", "message": "...", "errors": [...] }` 형태.

## 프론트와 다른 점

- 상품·공지·배너 id 는 DB 숫자 PK 의 문자열이다(`"prod-001"` → `"1"`). 회원 `id` 는 로그인 아이디.
- 상세 `reviewCount` 는 실제 리뷰 수다(mock 은 390 고정).
- 결제(PG) 연동 전이라 주문은 생성 즉시 `PAID` 로 기록된다.
- 쿠폰·적립금·재입고 알림, 소셜 로그인은 아직 없다.
