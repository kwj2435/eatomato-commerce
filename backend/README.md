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

로그인·가입 응답의 `accessToken`(30분)을 `Authorization: Bearer <token>` 헤더로 보낸다.
만료되면 `refreshToken`(14일)으로 `POST /api/auth/refresh` 를 불러 새 토큰 한 쌍을 받는다. 리프레시 토큰은 한 번 쓰면 바뀌고(rotation),
서버에는 SHA-256 해시만 저장된다. 로그아웃은 리프레시 토큰을, 회원 정지는 그 회원의 모든 리프레시 토큰을 폐기하며,
정지된 회원은 남은 액세스 토큰으로도 회원 API 를 쓸 수 없다(`MEMBER_DISABLED`).
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
| GET | `/api/site-contents` | 사이트 문구 `{키: 문구}` (수정 안 한 문구는 기본값) | 메인 What's New·Review 설명 |
| GET | `/api/reviews/featured?limit=4` | 메인 대표 리뷰 썸네일 | `listFeaturedReviews` |
| GET | `/api/notices?query=` | 공지 목록 (고정 → 등록일 내림차순, 제목 검색) | `listNotices` |
| GET | `/api/notices/ids` · `/api/notices/{id}` | 공지 id 목록 / 단건 | `listNoticeIds` · `getNotice` |
| POST | `/api/auth/signup` | 가입 `{loginId,password,email,name}` → 토큰 | |
| POST | `/api/auth/login` | 로그인 `{loginId(아이디 또는 이메일),password}` → 토큰 | `LoginForm` |
| POST | `/api/auth/refresh` | 토큰 갱신 `{refreshToken}` → 새 토큰 한 쌍 | `auth-store` |
| POST | `/api/auth/logout` | 리프레시 토큰 폐기 `{refreshToken}` → 204 | 로그아웃 |
| GET | `/api/auth/kakao/authorize?redirectUri=&state=` | 카카오 인가 화면으로 302 | 카카오 로그인 버튼 |
| POST | `/api/auth/kakao` | 카카오 인가 코드로 로그인·가입 `{code, redirectUri}` → 토큰 | `/login/kakao/` |
| GET · PATCH | `/api/me` 🔒 | 회원 정보 조회 / 수정 (null 필드는 유지) | `getMyMember` · `updateMyMember` |
| PUT | `/api/me/password` 🔒 | 비밀번호 변경 | |
| GET | `/api/cart` 🔒 | 장바구니 + 요약(선택 항목 합산, 배송비) | `cart-store` |
| POST | `/api/cart/items` 🔒 | 담기 `{productId, options:{groupId:choiceId}, quantity}` | `addItem` |
| PATCH | `/api/cart/items/{id}` 🔒 | 수량·선택 변경 `{quantity?, selected?}` | `updateQuantity` · `toggleSelected` |
| PUT | `/api/cart/selection` 🔒 | 전체 선택/해제 `{selected}` | `toggleAllSelected` |
| DELETE | `/api/cart/items/{id}` · `/api/cart` 🔒 | 항목 삭제 / 비우기 | `removeItem` · `clear` |
| POST | `/api/orders` 🔒 | 주문서 제출 `{cartItemIds?, shipping{recipientName, recipientPhone, zipCode, roadAddress, detailAddress?, deliveryMemo?}}` → 결제대기 주문, 재고 선점 | 주문서 |
| GET | `/api/payments/config` 🔒 | 결제창 설정 `{provider: TOSS\|MOCK, clientKey}` (토스 결제위젯 공개 키) | 주문서 |
| POST | `/api/payments/confirm` 🔒 | 결제 승인 `{orderNumber, paymentKey, amount}` → 결제완료 (금액 서버 대조, 중복 요청 안전) | 결제 완료 화면 |
| POST | `/api/payments/webhook` | PG 결과 알림 `{orderNumber, paymentKey, status: DONE\|CANCELED, amount}` (헤더 `X-Payment-Webhook-Secret`) | PG 서버 |
| POST | `/api/payments/toss/webhook` | 토스페이먼츠 웹훅(`PAYMENT_STATUS_CHANGED`). 본문은 믿지 않고 토스 조회로 확인해 상점관리자 취소를 반영 | 토스 서버 |
| POST | `/api/orders/{orderNumber}/cancel` 🔒 | 고객 취소(결제대기·결제완료). 환불·재고 복원 | 마이페이지 |
| GET | `/api/orders` · `/api/orders/{orderNumber}` 🔒 | 주문 내역 | 마이페이지 주문 내역 |
| GET | `/api/shipping-policy` | 배송비 정책 `{baseFee, freeThreshold, remoteAreaFee}` | 상세·장바구니·주문서 |
| PUT | `/api/me/profile` 🔒 | 가입 후 추가 정보 `{nickname, zipCode, roadAddress, detailAddress}` | 추가 정보 입력 |
| GET | `/api/me/reviewable-products` 🔒 | 후기 작성 가능 상품 | `listReviewableProducts` |
| POST | `/api/reviews` 🔒 | 후기 저장 (multipart: `orderItemId`, `rating`, `content`, `photos`≤5) | `ReviewWriteForm` |
| GET | `/api/me/reviews` 🔒 | 내가 쓴 후기 | 마이페이지 내가 쓴 글 |

### 관리자 API (`/api/admin/**`, 관리자 권한 필요)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/admin/dashboard` | 오늘·이번 달·누적 매출, 회원·상품 수, 주문 상태별 건수, 14일 일별 매출, 인기 상품, 최근 주문 |
| GET · POST | `/api/admin/products` | 상품 목록(`q`, `category`, `page`) / 등록 |
| GET | `/api/admin/products/all` | 함께 구매 선택용 전체 목록 |
| GET · PUT · DELETE | `/api/admin/products/{id}` | 상세 / 전체 수정(옵션·함께 구매 포함) / 삭제(소프트 삭제) |
| PATCH | `/api/admin/products/{id}/visible` | 노출·숨김 `{visible}` |
| GET | `/api/admin/members` · `/api/admin/members/{id}` | 회원 목록(`q`, `role`) / 상세(최근 주문 포함) |
| PATCH | `/api/admin/members/{id}` | 등급·권한·이용 정지 `{grade?, role?, enabled?}` (본인 권한·상태는 못 바꿈) |
| GET | `/api/admin/orders` | 주문 목록(`status`, `q`=주문번호·주문자 아이디) |
| PATCH | `/api/admin/orders/{orderNumber}/status` | 상태 변경 `PAID` `SHIPPING` `DELIVERED` `CANCELLED` |
| GET · POST · PUT · DELETE | `/api/admin/banners[/{id}]` | 메인 배너 관리 |
| GET · POST · PUT · DELETE | `/api/admin/notices[/{id}]` | 공지 관리 |
| GET · PUT · DELETE | `/api/admin/site-contents[/{key}]` | 사이트 문구(메인 섹션 설명 등) 조회 / 수정 `{value}` / 기본값으로 |
| POST | `/api/admin/uploads?category=products\|banners` | 이미지 업로드 (multipart `file`) → `{url}` |
| PATCH | `/api/admin/products/{id}/stock` | 재고만 변경 `{stockQuantity}` (null = 재고 관리 안 함) |
| GET · PUT | `/api/admin/shipping-policy` | 배송비 정책 조회·변경 |

관리자 권한은 JWT 의 `roles` 클레임으로 1차 확인하고, `AdminAccessInterceptor` 가 요청마다 DB 의 권한·이용 상태를 다시 본다.
첫 관리자 계정은 `ADMIN_LOGIN_ID` / `ADMIN_PASSWORD` 로 만든다(`AdminBootstrap`). local 프로필은 `admin` / `admin1234`.

장바구니 변경 API 는 모두 변경 후의 장바구니 전체를 돌려준다.
에러 응답은 `{ "code": "PRODUCT_NOT_FOUND", "message": "...", "errors": [...] }` 형태.

## 프론트와 다른 점

- 상품·공지·배너 id 는 DB 숫자 PK 의 문자열이다(`"prod-001"` → `"1"`). 회원 `id` 는 로그인 아이디.
- 상세 `reviewCount` 는 실제 리뷰 수다(mock 은 390 고정).
- 주문 흐름: 주문서 제출 → `PENDING_PAYMENT`(재고 선점) → 결제 승인 → `PAID` → `SHIPPING` → `DELIVERED`. 취소는 배송 전까지(환불·재고 복원·판매량 되돌림). 허용되지 않는 전이는 400, 변경 이력은 `order_status_history`.
- 결제: `PaymentGateway` 인터페이스로 PG 를 붙인다. `PAYMENT_PROVIDER=mock`(기본)은 `MockPaymentGateway` 가 항상 승인하고, `toss` 는 `TossPaymentGateway`(토스페이먼츠 결제위젯)가 승인·취소한다. 결제대기 30분이 지나면 자동 취소.
  - 토스: 개발자센터 > API 키의 **결제위젯 연동 키**를 `TOSS_CLIENT_KEY`(test_gck_)·`TOSS_SECRET_KEY`(test_gsk_)에 넣는다(API 개별 연동 키 test_ck_ 는 위젯에서 안 된다). 결제위젯 어드민에서 가상계좌는 끈다(입금 대기는 결제완료로 보지 않는다).
- 재고: 상품 단위(`stock_quantity`, null = 무제한). 조건부 UPDATE 로 차감해 동시 주문에도 음수가 되지 않는다. 옵션 조합(SKU) 단위 재고는 아직 없다.
- 배송비: `shipping_policy` 한 줄(관리자 설정). 제주(우편번호 63…)는 추가 배송비. 도서 산간 전체 목록은 미반영.
- 로그인 잠금: 15분 안에 계정별 5회·IP별 20회 실패하면 잠금(메모리, 서버 1대 기준). nginx 가 `/api/auth/login|signup` 을 IP당 분당 10회로 한 번 더 제한.
- 상품 삭제는 소프트 삭제다(주문 내역이 참조). 스토어 조회에서 빠지고 slug 는 다시 쓸 수 있게 비켜 둔다.
- 카카오 로그인: 카카오 회원번호로 회원을 찾고, 없으면 카카오가 확인한 이메일과 같은 기존 회원에 자동 연결, 그것도 없으면 가입한다. 이메일 동의가 필수다.
- 쿠폰·적립금·재입고 알림은 아직 없다.
