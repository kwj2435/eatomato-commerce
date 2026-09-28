# 프론트엔드 이미지: Next.js 정적 export 결과물(out/)을 Nginx 로 서빙한다.
#
# next.config.ts 가 `output: "export"` 라 런타임 Node 서버가 필요 없다.
# 빌드 단계에서만 Node 를 쓰고, 최종 이미지는 nginx:alpine 에 정적 파일만 담아 가볍게 유지한다.
# GITHUB_PAGES 를 넘기지 않으므로 basePath 없이 도메인 루트(/)에서 서빙된다.
#
# 상품·공지 등은 빌드 시점에 백엔드 API 에서 받아 HTML 로 굳힌다. 그래서 빌드할 때 백엔드가 떠 있어야 한다.
# - API_BASE_URL: 빌드 컨테이너가 부를 백엔드 주소 (VM 에서는 host 네트워크로 127.0.0.1:8080)
# - NEXT_PUBLIC_API_BASE_URL: 브라우저가 부를 주소. 비우면 같은 출처(/api) → 호스트 nginx 가 백엔드로 넘긴다.

# ── build ─────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG API_BASE_URL=http://127.0.0.1:8080
ARG NEXT_PUBLIC_API_BASE_URL=
ENV API_BASE_URL=$API_BASE_URL NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build

# ── runtime ───────────────────────────────────────────
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html

EXPOSE 80
