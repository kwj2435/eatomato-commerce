This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

데이터는 백엔드(`../backend`) API 에서 받는다. 먼저 백엔드를 띄운다(H2 인메모리 + 데모 데이터).

```bash
cd ../backend && ./gradlew bootRun --args='--spring.profiles.active=local'
```

그다음 프론트 개발 서버를 띄운다. 별도 설정이 없으면 `http://localhost:8080` 을 API 로 쓴다.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

| 환경 변수 | 쓰는 곳 | 기본값 |
|---|---|---|
| `API_BASE_URL` | 빌드(서버 컴포넌트)가 상품·공지 등을 받아 정적 HTML 을 만들 때 | `http://localhost:8080` |
| `NEXT_PUBLIC_API_BASE_URL` | 브라우저가 로그인·장바구니·검색 등을 호출할 때 (빌드 시점에 번들에 박힌다) | 개발: `http://localhost:8080`, 빌드: 같은 출처(`/api`) |

상품·공지·배너는 빌드 시점 데이터로 정적 페이지가 만들어지므로, 백엔드 데이터가 바뀌면 프론트를 다시 빌드해야 반영된다.
(상세 페이지 리뷰, 검색, 장바구니, 마이페이지는 브라우저가 매번 API 를 불러 항상 최신이다.)

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
